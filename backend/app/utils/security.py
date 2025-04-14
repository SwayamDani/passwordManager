from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.config import settings

security = HTTPBearer()

class JWTHandler:
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
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
    return base64.b64encode(os.urandom(16)).decode('utf-8')

def get_password_hash(password: str, salt: str) -> str:
    """
    Hash a password with Argon2
    
    This function combines the provided salt with the password
    to generate a secure hash.
    """
    try:
        # Combine password and salt before hashing
        combined = (password + salt).encode('utf-8')
        hashed = ph.hash(combined)
        logger.info(f"Password hashed successfully")
        return hashed
    except Exception as e:
        logger.error(f"Error in get_password_hash: {str(e)}")
        raise

def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """
    Verify a password against its hash using Argon2
    """
    try:
        # Debug info
        logger.info(f"Verifying password")
        logger.info(f"Salt type: {type(salt)}, salt length: {len(salt) if salt else 'None'}")
        logger.info(f"Hash starts with: {hashed_password[:20]}...")

        # Check for empty or None values
        if not plain_password or not hashed_password or not salt:
            logger.error(f"Missing required values: password={bool(plain_password)}, hash={bool(hashed_password)}, salt={bool(salt)}")
            return False

        # Combine password and salt the same way as when hashing
        combined = (plain_password + salt).encode('utf-8')
        
        # Log hash format info
        if hashed_password.startswith('$argon2'):
            logger.info("Hash is in Argon2 format")
        else:
            logger.warning("Hash is NOT in Argon2 format")

        # Verify using Argon2
        ph.verify(hashed_password, combined)
        logger.info("Password verification successful")
        return True
    except Exception as e:
        logger.warning(f"Password verification failed: {str(e)}")
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