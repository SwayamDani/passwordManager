from fastapi import HTTPException, Request
from fastapi_limiter import FastAPILimiter
import redis.asyncio as redis
import os
from datetime import timedelta
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Optional
import threading
import time
import logging
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RateLimitConfig:
    """Rate limiting configuration"""
    LOGIN_MAX_ATTEMPTS = 5
    LOGIN_WINDOW = 300  # 5 minutes
    LOCKOUT_DURATION = 900  # 15 minutes

class LoginRateLimiter:
    def __init__(self):
        self.redis_client = None
        self.config = RateLimitConfig()

    async def setup(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                decode_responses=True
            )
            await self.redis_client.ping()
            return True
        except redis.ConnectionError as e:
            print(f"Redis connection error: {e}")
            return False

    async def check_rate_limit(self, request: Request) -> bool:
        if not self.redis_client:
            await self.setup()

        ip = request.client.host
        attempts_key = f"login:{ip}:attempts"
        lockout_key = f"login:{ip}:lockout"

        # Check if user is locked out
        if await self.redis_client.exists(lockout_key):
            ttl = await self.redis_client.ttl(lockout_key)
            raise HTTPException(
                status_code=429,
                detail=f"Account locked. Try again in {ttl} seconds"
            )

        # Get attempt count
        attempts = await self.redis_client.get(attempts_key)
        attempts = int(attempts) if attempts else 0

        if attempts >= self.config.LOGIN_MAX_ATTEMPTS:
            # Set lockout
            await self.redis_client.setex(
                lockout_key,
                self.config.LOCKOUT_DURATION,
                1
            )
            raise HTTPException(
                status_code=429,
                detail=f"Too many attempts. Account locked for {self.config.LOCKOUT_DURATION} seconds"
            )

        # Increment attempts
        await self.redis_client.setex(
            attempts_key,
            self.config.LOGIN_WINDOW,
            attempts + 1
        )
        return True

    async def reset_attempts(self, request: Request):
        """Reset attempts after successful login"""
        if not self.redis_client:
            await self.setup()
        
        ip = request.client.host
        await self.redis_client.delete(f"login:{ip}:attempts")

async def setup_limiter():
    """Initialize Redis connection"""
    try:
        redis_client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )
        await redis_client.ping()
        logger.info("✓ Connected to Memurai successfully")
        return redis_client
    except Exception as e:
        logger.error(f"✗ Memurai connection failed: {e}")
        return None

class FailsafeRateLimiter:
    def __init__(self):
        self.redis = None
        self.config = {
            'MAX_ATTEMPTS': 5,
            'WINDOW_SECONDS': 300,  # 5 minutes
            'LOCKOUT_SECONDS': 900  # 15 minutes
        }

    async def init(self, redis_client):
        self.redis = redis_client

    async def check_rate_limit(self, request: Request) -> bool:  # Changed from is_rate_limited
        """Check if the request is rate limited"""
        if not self.redis:
            return False

        ip = request.client.host
        key = f"rate:limit:{ip}"
        lockout_key = f"rate:lockout:{ip}"

        # Check lockout
        if await self.redis.exists(lockout_key):
            ttl = await self.redis.ttl(lockout_key)
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Too many attempts",
                    "retry_after": ttl
                }
            )

        # Check and increment attempts
        attempts = await self.redis.incr(key)
        if attempts == 1:
            await self.redis.expire(key, self.config['WINDOW_SECONDS'])

        if attempts > self.config['MAX_ATTEMPTS']:
            await self.redis.setex(
                lockout_key,
                self.config['LOCKOUT_SECONDS'],
                1
            )
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Account locked",
                    "retry_after": self.config['LOCKOUT_SECONDS']
                }
            )
        
        return False

    async def reset_attempts(self, request: Request):
        """Reset rate limiting for an IP"""
        if self.redis:
            ip = request.client.host
            await self.redis.delete(f"rate:limit:{ip}", f"rate:lockout:{ip}")