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
import base64
import logging
from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Argon2 password hasher
ph = PasswordHasher()

# Secret key for JWT
SECRET_KEY = os.getenv('SECRET_KEY') or secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours instead of 30 minutes

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
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 1440  # 24 hours instead of 60 minutes

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expires_delta = timedelta(minutes=self.access_token_expire_minutes)
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> dict:
        try:
            # First attempt: standard verification
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Validate expiration time specifically to provide better error messages
            if 'exp' in payload:
                exp_timestamp = payload['exp']
                current_timestamp = datetime.utcnow().timestamp()
                
                if current_timestamp > exp_timestamp:
                    logger.warning(f"Token expired: exp={exp_timestamp}, now={current_timestamp}")
                    raise HTTPException(status_code=401, detail="Token has expired")
            
            # Validate that the subject claim exists
            if 'sub' not in payload:
                logger.warning("Token missing 'sub' claim")
                raise HTTPException(status_code=401, detail="Invalid token format")
                
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired signature")
            raise HTTPException(status_code=401, detail="Token has expired")
        except JWTError as e:
            logger.warning(f"Invalid token: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        except Exception as e:
            logger.error(f"Unexpected error verifying token: {str(e)}")
            raise HTTPException(status_code=401, detail="Authentication error")

    async def verify_jwt(self, credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())) -> dict:
        return self.verify_token(credentials.credentials)

# Password handling functions
def generate_salt() -> str:
    """Generate a random salt for password hashing"""
    return base64.b64encode(os.urandom(16)).decode('utf-8')

def get_password_hash(password: str, salt: str) -> str:
    """
    Hash a password with Argon2 if available, falling back to SHA-256
    
    This function combines the provided salt with the password
    to generate a secure hash.
    """
    try:
        # Try to use Argon2 for better security
        print (password)
        combined = (password + salt).encode('utf-8')
        return ph.hash(combined)
    except Exception as e:
        # Fall back to SHA-256 if Argon2 fails
        logger.warning(f"Argon2 hashing failed: {e}, using SHA-256 fallback")
        hash_obj = hashlib.sha256()
        hash_obj.update((password + salt).encode('utf-8'))
        return hash_obj.hexdigest()

def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """
    Verify a password against its hash using Argon2 if the hash is in Argon2 format,
    otherwise fall back to SHA-256
    """
    try:
        # Check if hash looks like an Argon2 hash (starts with $argon2)
        if hashed_password.startswith('$argon2'):
            combined = (plain_password + salt).encode('utf-8')
            ph.verify(hashed_password, combined)
            return True
        else:
            # Fall back to SHA-256 verification
            return get_password_hash(plain_password, salt) == hashed_password
    except Exception:
        # If verification fails, return False
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