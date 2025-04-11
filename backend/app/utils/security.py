from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import os
import secrets
import hashlib
from argon2 import PasswordHasher
from app.core.models import User
from app.core.database import SessionLocal

# Secret key for JWT
SECRET_KEY = os.getenv('SECRET_KEY') or secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Standalone functions for JWT (in addition to the JWTHandler class)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )

class JWTHandler:
    def __init__(self, secret_key: str = None):
        # Use provided secret key or generate a new one
        self.secret_key = secret_key or os.getenv('SECRET_KEY') or secrets.token_urlsafe(32)
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )

    async def verify_jwt(self, credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())) -> dict:
        return self.verify_token(credentials.credentials)

# Password handling functions
def generate_salt() -> str:
    """Generate a random salt for password hashing"""
    return os.urandom(32).hex()

def get_password_hash(password: str, salt: str) -> str:
    """Hash a password with Argon2"""
    hasher = PasswordHasher()
    return hasher.hash(password + salt)

def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """Verify a password against its hash"""
    hasher = PasswordHasher()
    try:
        return hasher.verify(hashed_password, plain_password + salt)
    except Exception:
        return False

# User authentication
async def get_current_user(token: HTTPAuthorizationCredentials = Security(HTTPBearer())):
    """Get the current authenticated user from the JWT token"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        handler = JWTHandler()
        payload = handler.verify_token(token.credentials)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception
        return user
    finally:
        db.close()