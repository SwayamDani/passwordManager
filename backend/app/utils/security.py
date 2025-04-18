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
# Increase token expiration time to 12 hours for better user experience
ACCESS_TOKEN_EXPIRE_MINUTES = 12 * 60  # 12 hours

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
        # Use the same expiration time as the global setting
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

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
    Hash a password with Argon2
    
    This function combines the provided salt with the password
    to generate a secure hash using Argon2.
    """
    # Use Argon2 for security
    combined = (password + salt).encode('utf-8')
    return ph.hash(combined)

def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """
    Verify a password against its hash using Argon2
    """
    try:
        # Enhanced logging for debugging
        logger.info(f"SECURITY_VERIFY - Plain password: {plain_password}")
        logger.info(f"SECURITY_VERIFY - Hashed password: {hashed_password}")
        logger.info(f"SECURITY_VERIFY - Salt: {salt}")
        
        # Combine password with salt
        combined = (plain_password + salt).encode('utf-8')
        logger.info(f"SECURITY_VERIFY - Combined input (password+salt): {combined}")
        
        # Verify using Argon2
        try:
            ph.verify(hashed_password, combined)
            logger.info("SECURITY_VERIFY - Argon2 verification successful")
            return True
        except Exception as e:
            logger.error(f"SECURITY_VERIFY - Argon2 verification failed: {e}")
            return False
    except Exception as e:
        # If verification fails, return False
        logger.error(f"SECURITY_VERIFY - Exception during verification: {e}")
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
