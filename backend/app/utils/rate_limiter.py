from fastapi import HTTPException, Request
from fastapi_limiter import FastAPILimiter
import redis.asyncio as redis
from app.config import settings
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
    LOGIN_MAX_ATTEMPTS = 15
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
        self.prefix = "rate:"
        self.max_attempts = 5
        self.window = 300  # 5 minutes
        self.lockout = 900  # 15 minutes

    async def init(self, redis_client: redis.Redis):
        self.redis = redis_client
        logger.info("✓ Connected to Memurai successfully")

    async def check_rate_limit(self, request: Request) -> bool:
        """Check if request is rate limited"""
        if not self.redis:
            return True
        
        key = f"{self.prefix}{request.client.host}"
        try:
            attempts = await self.redis.get(key)
            if not attempts:
                await self.redis.set(key, 1, ex=self.window)
                return True
            
            attempts = int(attempts)
            if attempts >= self.max_attempts:
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many attempts. Try again in {self.lockout/60} minutes"
                )
            
            await self.redis.incr(key)
            return True
            
        except redis.RedisError:
            logger.warning("⚠ Redis error - failsafe mode active")
            return True

    async def reset_attempts(self, request: Request):
        """Reset attempt counter for IP"""
        if not self.redis:
            return
        
        key = f"{self.prefix}{request.client.host}"
        try:
            await self.redis.delete(key)
        except redis.RedisError:
            logger.warning("⚠ Redis error - could not reset attempts")