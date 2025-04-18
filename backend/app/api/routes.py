from fastapi import FastAPI, HTTPException, Request, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Import our refactored SOLID components
from app.core.password_manager import PasswordManager, PasswordManagerFactory
from app.utils.security import JWTHandler
from fastapi_limiter import FastAPILimiter
from contextlib import asynccontextmanager

# Import our new auth router
from app.api.auth import router as auth_router

# Add new imports for user settings
from app.core.models import User
from app.core.database import SessionLocal
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks

# Database dependency - moved to the top of the file
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Import email sending from auth module for password reset
from app.api.auth import send_email

app = FastAPI(title="Password Manager API")
jwt_handler = JWTHandler()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://password-manager-eight-lovat.vercel.app", 
        "https://password-manager-swayam-danis-projects.vercel.app",
        "https://password-manager-npw6ufwem-swayam-danis-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include our new authentication routes
app.include_router(auth_router)

# Add root route
@app.get("/")
async def root():
    return {"message": "Password Manager API is running"}

# Initialize manager using the factory pattern
password_manager = PasswordManager()

# Request models
class UserCredentials(BaseModel):
    username: str
    password: str

class AccountCreate(BaseModel):
    service: str
    username: str
    password: str
    master_password: str  # Added for encryption key generation
    has_2fa: bool = False

class PasswordCheck(BaseModel):
    password: str

# New models for user settings
class UserEmail(BaseModel):
    email: str

class UserSettings(BaseModel):
    username: str
    email: Optional[str] = None
    totp_enabled: bool = False
    created_at: Optional[datetime] = None

# Add new model for password reset request
class PasswordResetRequest(BaseModel):
    username_or_email: str

@app.post("/api/login")
async def login(credentials: UserCredentials, request: Request):
    try:
        import logging
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        # Log password for debugging (REMOVE IN PRODUCTION)
        logger.info(f"LOGIN - Username entered: {credentials.username}")
        logger.info(f"LOGIN - Password entered: {credentials.password}")
        
        # Get user from database to log the stored password hash
        from app.core.models import User
        from app.core.database import SessionLocal
        
        with SessionLocal() as db:
            user = db.query(User).filter(User.username == credentials.username).first()
            if user:
                logger.info(f"LOGIN - User found in database: {user.username}")
                logger.info(f"LOGIN - Stored password hash: {user.password}")
                logger.info(f"LOGIN - Stored salt: {user.salt}")
            else:
                logger.info(f"LOGIN - User not found: {credentials.username}")
        
        # Get user ID along with authentication
        user_id = password_manager.login(credentials.username, credentials.password)
        
        if user_id:
            logger.info(f"LOGIN - Authentication successful for user: {credentials.username}")
            access_token = jwt_handler.create_access_token(
                data={"sub": credentials.username}
            )
            return {
                "access_token": access_token, 
                "token_type": "bearer", 
                "username": credentials.username,
                "user_id": user_id  # Include the user_id in the response
            }
        
        logger.info(f"LOGIN - Authentication failed for user: {credentials.username}")
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )

@app.post("/api/register")
async def register(credentials: UserCredentials, request: Request):
    try:
        
        # Modified to capture user ID
        user_id = password_manager.create_user(credentials.username, credentials.password)
        
        if user_id:
            return {
                "message": "User created successfully",
                "user_id": user_id
            }
            
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Add a dependency for protected routes
async def get_current_user(token: HTTPAuthorizationCredentials = Security(HTTPBearer())):
    payload = jwt_handler.verify_token(token.credentials)
    username = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return username

# Add a combined dependency that gets both the authenticated user and DB session
# This helps with endpoints that need both user authentication and database access
async def get_authenticated_user_and_db(token: HTTPAuthorizationCredentials = Security(HTTPBearer())):
    """
    Get both the authenticated username and a database session.
    Reduces code duplication and ensures consistent auth for DB-dependent endpoints.
    """
    try:
        # Verify the token and extract username
        payload = jwt_handler.verify_token(token.credentials)
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Get a database session
        db = SessionLocal()
        try:
            yield (username, db)
        finally:
            db.close()
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# Example of a protected route
@app.get("/api/accounts")
async def get_accounts(username: str = Depends(get_current_user)):
    try:
        accounts = password_manager.get_accounts(username)
        return accounts
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Add duplicate route without /api/ prefix for backward compatibility
@app.get("/accounts")
async def get_accounts_compat(username: str = Depends(get_current_user)):
    """Route for backward compatibility with clients not using /api/ prefix"""
    try:
        accounts = password_manager.get_accounts(username)
        return accounts
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/api/accounts")
async def create_account(
    account: AccountCreate,
    username: str = Depends(get_current_user)
):
    try:
        # Set the current password for encryption
        password_manager.user_manager.current_password = account.master_password
        
        success = password_manager.add_account(
            username,
            account.service,
            account.username,
            account.password,
            account.has_2fa
        )
        if success:
            return {"message": "Account created successfully"}
        else:
            raise HTTPException(
                status_code=400, 
                detail="Account already exists for this service"
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Add duplicate route without /api/ prefix for backward compatibility
@app.post("/accounts")
async def create_account_compat(
    account: AccountCreate,
    username: str = Depends(get_current_user)
):
    """Route for backward compatibility with clients not using /api/ prefix"""
    try:
        # Set the current password for encryption
        password_manager.user_manager.current_password = account.master_password
        
        success = password_manager.add_account(
            username,
            account.service,
            account.username,
            account.password,
            account.has_2fa
        )
        if success:
            return {"message": "Account created successfully"}
        else:
            raise HTTPException(
                status_code=400, 
                detail="Account already exists for this service"
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/password/check")
async def check_password(password_data: PasswordCheck):
    strength_score, feedback = password_manager.check_password_strength(password_data.password)
    is_breached, count = password_manager.check_password_breach(password_data.password)
    return {
        "strength_score": strength_score,
        "feedback": feedback,
        "is_breached": is_breached,
        "breach_count": count
    }

@app.get("/api/password/generate")
async def generate_password(length: int = 16):
    password = password_manager.generate_password(length)
    return {"password": password}

@app.delete("/api/accounts/{service}")
async def delete_account(
    service: str,
    username: str = Depends(get_current_user)
):
    try:
        success = password_manager.delete_account(username, service)
        if success:
            return {"message": "Account deleted successfully"}
        raise HTTPException(
            status_code=404,
            detail=f"Account for service '{service}' not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Add duplicate route without /api/ prefix for backward compatibility
@app.delete("/accounts/{service}")
async def delete_account_compat(
    service: str,
    username: str = Depends(get_current_user)
):
    """Route for backward compatibility with clients not using /api/ prefix"""
    try:
        success = password_manager.delete_account(username, service)
        if success:
            return {"message": "Account deleted successfully"}
        raise HTTPException(
            status_code=404,
            detail=f"Account for service '{service}' not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.put("/api/accounts/{service}")
async def update_account(
    service: str,
    account: AccountCreate,
    username: str = Depends(get_current_user)
):
    try:
        # Set the current password for encryption
        password_manager.user_manager.current_password = account.master_password
        
        success = password_manager.update_account(
            username=username,
            service=service,
            new_username=account.username,
            new_password=account.password,
            new_has_2fa=account.has_2fa
        )
        if success:
            return {"message": "Account updated successfully"}
        raise HTTPException(
            status_code=404,
            detail=f"Account for service '{service}' not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Add duplicate route without /api/ prefix for backward compatibility
@app.put("/accounts/{service}")
async def update_account_compat(
    service: str,
    account: AccountCreate,
    username: str = Depends(get_current_user)
):
    """Route for backward compatibility with clients not using /api/ prefix"""
    try:
        # Set the current password for encryption
        password_manager.user_manager.current_password = account.master_password
        
        success = password_manager.update_account(
            username=username,
            service=service,
            new_username=account.username,
            new_password=account.password,
            new_has_2fa=account.has_2fa
        )
        if success:
            return {"message": "Account updated successfully"}
        raise HTTPException(
            status_code=404,
            detail=f"Account for service '{service}' not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/api/accounts/aging")
async def get_aging_passwords(
    username: str = Depends(get_current_user)
) -> List[dict]:
    try:
        aging_passwords = password_manager.check_password_age(username)
        return aging_passwords
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check password age: {str(e)}"
        )

# Add duplicate route without /api/ prefix for backward compatibility
@app.get("/accounts/aging")
async def get_aging_passwords_compat(
    username: str = Depends(get_current_user)
) -> List[dict]:
    """Route for backward compatibility with clients not using /api/ prefix"""
    try:
        aging_passwords = password_manager.check_password_age(username)
        return aging_passwords
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check password age: {str(e)}"
        )

# TOTP (2FA) related endpoints
@app.post("/api/totp/generate")
async def generate_totp(username: str = Depends(get_current_user)):
    """Generate a new TOTP secret for the user"""
    secret = password_manager.generate_totp_secret(username)
    if not secret:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate TOTP secret"
        )
    
    qr_code = password_manager.get_totp_qr_code(username)
    return {
        "secret": secret,
        "qr_code": qr_code
    }

# Updated to accept token in request body
class TOTPVerifyRequest(BaseModel):
    token: str

@app.post("/api/totp/verify")
async def verify_totp(
    verify_data: TOTPVerifyRequest = None, 
    token: str = None, 
    username: str = Depends(get_current_user)
):
    """Verify a TOTP token and enable 2FA if valid"""
    # Get token from either request body or query parameter
    verification_token = None
    if verify_data:
        verification_token = verify_data.token
    elif token:
        verification_token = token
    
    if not verification_token:
        raise HTTPException(
            status_code=400,
            detail="TOTP token is required"
        )
    
    if password_manager.verify_totp(username, verification_token):
        return {"verified": True}
    
    raise HTTPException(
        status_code=400,
        detail="Invalid TOTP token"
    )

@app.delete("/api/totp/disable")
async def disable_totp(username: str = Depends(get_current_user)):
    """Disable TOTP for the user"""
    if password_manager.disable_totp(username):
        return {"message": "2FA disabled successfully"}
    
    raise HTTPException(
        status_code=500,
        detail="Failed to disable 2FA"
    )

@app.get("/api/totp/status")
async def get_totp_status(username: str = Depends(get_current_user)):
    """Check if TOTP is enabled for the user"""
    return {
        "enabled": password_manager.is_totp_enabled(username)
    }

# User settings endpoints
@app.get("/api/user/settings", response_model=UserSettings)
async def get_user_settings(user_data = Depends(get_authenticated_user_and_db)):
    """Get the current user's settings"""
    username, db = user_data
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserSettings(
        username=user.username,
        email=user.email,
        totp_enabled=user.totp_enabled,
        created_at=user.created_at
    )

@app.put("/api/user/email")
async def update_user_email(
    email_data: UserEmail,
    user_data = Depends(get_authenticated_user_and_db)
):
    """Update the user's email address"""
    username, db = user_data
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is already used by another user
    existing_user = db.query(User).filter(User.email == email_data.email).first()
    if existing_user and existing_user.username != username:
        raise HTTPException(status_code=400, detail="Email address already in use")
    
    user.email = email_data.email
    db.commit()
    
    return {"message": "Email updated successfully"}

# Add the missing endpoint for password reset request
@app.post("/api/reset-password-request")
async def reset_password_request(
    reset_request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Initiate password reset process
    """
    # Look up user by username or email
    user = db.query(User).filter(
        (User.username == reset_request.username_or_email) | (User.email == reset_request.username_or_email)
    ).first()
    
    # Always return success message to prevent username/email enumeration
    if not user or not user.email:
        return {
            "status": "success", 
            "message": "If an account with that username/email exists, a reset link has been sent"
        }
    
    # Generate reset token
    from app.utils.totp import PasswordReset
    reset_token = PasswordReset.generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = PasswordReset.get_token_expiration()
    db.commit()
    
    # Construct reset email with proper frontend URL
    from app.config import settings
    reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?token={reset_token}"
    email_content = f"""
    Hello {user.username},
    
    Please use the following link to reset your password:
    {reset_link}
    
    This link will expire in 30 minutes.
    
    If you did not request a password reset, please ignore this email.
    """
    
    # Send email in the background
    background_tasks.add_task(
        send_email, 
        user.email, 
        "Password Reset Request", 
        email_content
    )
    
    return {
        "status": "success", 
        "message": "If an account with that username/email exists, a reset link has been sent"
    }

@app.get("/api/validate-reset-token/{token}")
async def validate_reset_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Validate a password reset token
    """
    # Look up user by reset token
    from app.utils.totp import PasswordReset
    user = db.query(User).filter(User.reset_token == token).first()
    
    # Check if token exists and hasn't expired
    if not user or not user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check if token has expired
    if datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Token is valid
    return {"status": "valid", "message": "Token is valid"}

# Add model for complete password reset request
class CompletePasswordReset(BaseModel):
    token: str
    new_password: str

@app.post("/api/reset-password")
async def complete_password_reset(
    reset_data: CompletePasswordReset,
    db: Session = Depends(get_db)
):
    """
    Complete the password reset process
    """
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Log the reset attempt
    logger.info(f"RESET_PASSWORD - Processing reset for token: {reset_data.token[:10]}...")
    
    # Look up user by reset token
    user = db.query(User).filter(User.reset_token == reset_data.token).first()
    
    # Check if token exists and hasn't expired
    if not user or not user.reset_token_expires:
        logger.error("RESET_PASSWORD - Invalid token or user not found")
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Log user info
    logger.info(f"RESET_PASSWORD - User found: {user.username}")
    logger.info(f"RESET_PASSWORD - Current hash: {user.password}")
    logger.info(f"RESET_PASSWORD - Current salt: {user.salt}")
    
    # Check if token has expired
    if datetime.utcnow() > user.reset_token_expires:
        logger.error("RESET_PASSWORD - Token expired")
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update the user's password
    from app.utils.security import get_password_hash, generate_salt
    salt = generate_salt()
    logger.info(f"RESET_PASSWORD - New salt: {salt}")
    
    hashed_password = get_password_hash(reset_data.new_password, salt)
    logger.info(f"RESET_PASSWORD - New hash: {hashed_password}")
    
    user.password = hashed_password
    user.salt = salt
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    logger.info(f"RESET_PASSWORD - Password updated for: {user.username}")
    
    return {"status": "success", "message": "Password reset successful"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)