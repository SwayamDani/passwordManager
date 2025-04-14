from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.database import SessionLocal
from app.core.models import User
from app.utils.totp import TwoFactorAuth, PasswordReset
from app.utils.security import (
    verify_password, get_password_hash, 
    create_access_token, get_current_user
)
from app.config import settings

# Email sending functionality
async def send_email(email: str, subject: str, content: str):
    """
    Send email using the configured SMTP server
    """
    try:
        # Create message
        message = MIMEMultipart()
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = email
        message["Subject"] = subject

        # Add body to email
        message.attach(MIMEText(content, "html"))
        
        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            # Start TLS for security
            server.starttls()
            
            # Login to account - use FROM_EMAIL for username with Gmail
            server.login(settings.SMTP_FROM_EMAIL, settings.SMTP_PASSWORD)
            
            # Send email
            server.send_message(message)
            
        print(f"Email sent successfully to {email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        # Don't raise exception to prevent leaking information
        return False

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={404: {"description": "Not found"}},
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 2FA Setup endpoints
@router.post("/2fa/setup")
async def setup_2fa(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Setup 2FA for the authenticated user
    """
    # Verify the user is authenticated and matches the requested user_id
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action"
        )
    
    # Generate new TOTP secret
    secret = TwoFactorAuth.generate_totp_secret()
    totp_uri = TwoFactorAuth.get_totp_uri(secret, current_user.username)
    qr_code = TwoFactorAuth.generate_qr_code(totp_uri)
    
    # Store secret but don't enable 2FA yet (requires verification)
    current_user.totp_secret = secret
    db.commit()
    
    return {
        "qr_code": f"data:image/png;base64,{qr_code}", 
        "secret": secret,
        "message": "Scan this QR code with your authenticator app, then verify with a code"
    }

@router.post("/2fa/verify")
async def verify_2fa_setup(
    token: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Verify and enable 2FA for the authenticated user
    """
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="2FA not initialized"
        )
    
    # Verify provided token against secret
    if TwoFactorAuth.verify_totp(current_user.totp_secret, token):
        current_user.totp_enabled = True  # Enable 2FA after successful verification
        db.commit()
        return {"status": "success", "message": "2FA enabled successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid verification code"
    )

@router.post("/2fa/disable")
async def disable_2fa(
    token: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Disable 2FA for the authenticated user
    """
    if not current_user.totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="2FA is not enabled"
        )
    
    # Verify provided token against secret
    if TwoFactorAuth.verify_totp(current_user.totp_secret, token):
        current_user.totp_enabled = False
        current_user.totp_secret = None
        db.commit()
        return {"status": "success", "message": "2FA disabled successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid verification code"
    )

# Password reset endpoints
@router.post("/forgot-password")
async def forgot_password(
    username_or_email: str, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Initiate password reset process
    """
    # Look up user by username or email
    user = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    
    # Always return success message to prevent username/email enumeration
    if not user or not user.email:
        return {
            "status": "success", 
            "message": "If an account with that username/email exists, a reset link has been sent"
        }
    
    # Generate reset token
    reset_token = PasswordReset.generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = PasswordReset.get_token_expiration()
    db.commit()
    
    # Construct reset email with proper frontend URL
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

@router.post("/reset-password/validate")
async def validate_reset_token(token: str, db: Session = Depends(get_db)):
    """
    Validate a reset token before allowing password reset
    """
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user or not PasswordReset.is_token_valid(user.reset_token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    # Check if user has 2FA enabled
    return {
        "status": "success",
        "requires_2fa": user.totp_enabled,
        "username": user.username
    }

@router.post("/reset-password/complete")
async def complete_password_reset(
    token: str,
    new_password: str,
    totp_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Complete the password reset process
    """
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user or not PasswordReset.is_token_valid(user.reset_token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    # If 2FA is enabled, verify TOTP code
    if user.totp_enabled:
        if not totp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="TOTP code required for 2FA-enabled accounts"
            )
        
        if not TwoFactorAuth.verify_totp(user.totp_secret, totp_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid TOTP code"
            )
    
    # Update the user's password
    from app.utils.security import get_password_hash, generate_salt
    salt = generate_salt()
    hashed_password = get_password_hash(new_password, salt)
    
    user.password = hashed_password
    user.salt = salt
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"status": "success", "message": "Password reset successful"}

# Login with 2FA support
@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    totp_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Authenticate a user with username/password and optional 2FA
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password, user.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # If 2FA is enabled, verify TOTP code
    if user.totp_enabled:
        if not totp_code:
            return {
                "status": "2fa_required",
                "message": "Please provide a TOTP code to complete authentication"
            }
        
        if not TwoFactorAuth.verify_totp(user.totp_secret, totp_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid TOTP code"
            )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "user_id": user.id
    }