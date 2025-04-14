"""
User management module for the password manager application.
"""

import os
import io
import base64
import pyotp
import qrcode
from argon2 import PasswordHasher
from typing import Optional, Tuple, Dict
from sqlalchemy.orm import Session

from .interfaces import IUserManager, ICryptoProvider
from .database import SessionLocal
from .models import User
from app.utils.security import verify_password as security_verify_password


class SQLUserManager(IUserManager):
    """Implementation of IUserManager using SQLAlchemy and SQLite."""
    
    def __init__(self, crypto_provider: ICryptoProvider):
        self.salt_length = 32
        self._current_user = None
        self.current_password = None  # For encryption/decryption
        self._login_verified = False  # Track if the login was verified
        self.password_hasher = PasswordHasher()
        self.crypto_provider = crypto_provider
        
    @property
    def current_user(self) -> Optional[str]:
        return self._current_user
        
    @current_user.setter
    def current_user(self, username: str):
        self._current_user = username
        
    @property
    def login_verified(self) -> bool:
        return self._login_verified
        
    @login_verified.setter
    def login_verified(self, verified: bool):
        self._login_verified = verified
    
    def get_user_accounts(self, username: str) -> Dict:
        """Get all accounts for a user from the database."""
        with SessionLocal() as db:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                return {}
                
            accounts_dict = {}
            for account in user.accounts:
                accounts_dict[account.service] = {
                    'username': account.username,
                    'password': account.password,
                    'has_2fa': account.has_2fa,
                    'last_changed': account.last_changed.isoformat(),
                    'password_strength': account.password_strength,
                    'password_breach': account.password_breach
                }
            return accounts_dict
    
    def hash_password(self, password: str, salt: bytes = None) -> str:
        """Hash a password using Argon2."""
        return self.password_hasher.hash(password)

    def verify_password(self, hashed_password: str, plain_password: str) -> bool:
        """Verify a password against its hash."""
        try:
            # First try to verify using Argon2
            try:
                return self.password_hasher.verify(hashed_password, plain_password)
            except Exception:
                # If Argon2 verification fails, try the security module's verify_password
                # Get the user's salt first
                with SessionLocal() as db:
                    user = db.query(User).filter(User.password == hashed_password).first()
                    if user and user.salt:
                        return security_verify_password(plain_password, hashed_password, user.salt)
                return False
        except Exception:
            return False
    
    def create_user(self, username: str, password: str) -> int:
        """Create a new user in the database. Returns the user ID if successful, or False if not."""
        try:
            with SessionLocal() as db:
                # Check if user already exists
                existing_user = db.query(User).filter(User.username == username).first()
                if existing_user:
                    return False
                
                # Generate salt and hash password
                salt = os.urandom(self.salt_length)
                password_hash = self.hash_password(password, salt)
                
                # Create new user
                new_user = User(
                    username=username,
                    password=password_hash,
                    salt=salt.hex(),  # Store salt as hex string
                    totp_secret=None,
                    totp_enabled=False
                )
                
                db.add(new_user)
                db.commit()
                db.refresh(new_user)  # Refresh to get the assigned ID
                return new_user.id
        except Exception as e:
            print(f"Error creating user: {e}")
            return False
    
    def login(self, username: str, password: str) -> bool:
        """Verify login credentials."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    return False
                
                # Verify password
                if self.verify_password(user.password, password):
                    self._current_user = username
                    self.current_password = password  # Store for encryption/decryption
                    return True
                return False
        except Exception as e:
            print(f"Error during login: {e}")
            return False
    
    def delete_user(self, username: str) -> bool:
        """Delete a user from the database."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    return False
                
                db.delete(user)
                db.commit()
                return True
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False

    def get_encryption_key(self, username: str, password: str) -> bytes:
        """Get the encryption key for a user based on their master password."""
        with SessionLocal() as db:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                return None
            
            # Get the user's salt
            try:
                # Try to convert from hex string (for newer users)
                if user.salt:  # Check if salt exists
                    try:
                        salt = bytes.fromhex(user.salt)
                    except ValueError:
                        # For existing users where salt might be stored differently
                        salt = user.salt.encode() if isinstance(user.salt, str) else user.salt
                else:
                    # If salt is None, generate a new one
                    salt = os.urandom(16)
                    # Save the new salt to the user
                    user.salt = salt.hex()
                    db.commit()
            except Exception as e:
                print(f"Error processing salt: {e}")
                # Fallback to a default salt
                salt = os.urandom(16)
            
            # Generate key using crypto provider
            key, _ = self.crypto_provider.generate_key(password, salt)
            return key

    def generate_totp_secret(self, username: str) -> str:
        """Generate a TOTP secret for a user."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    return None
                
                # Generate new TOTP secret
                secret = pyotp.random_base32()
                user.totp_secret = secret
                user.totp_enabled = False  # Not enabled until verified
                db.commit()
                
                return secret
        except Exception as e:
            print(f"Error generating TOTP secret: {e}")
            return None

    def get_totp_qr_code(self, username: str) -> str:
        """Generate a QR code for TOTP setup."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user or not user.totp_secret:
                    return None
                
                # Create OTP URI
                totp = pyotp.TOTP(user.totp_secret)
                uri = totp.provisioning_uri(username, issuer_name="Password Manager")
                
                # Generate QR code
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=qrcode.constants.ERROR_CORRECT_L,
                    box_size=10,
                    border=4,
                )
                qr.add_data(uri)
                qr.make(fit=True)
                
                img = qr.make_image(fill_color="black", back_color="white")
                
                # Convert to base64
                buffered = io.BytesIO()
                img.save(buffered)
                img_str = base64.b64encode(buffered.getvalue()).decode()
                
                return f"data:image/png;base64,{img_str}"
        except Exception as e:
            print(f"Error generating QR code: {e}")
            return None

    def verify_totp(self, username: str, token: str) -> bool:
        """Verify a TOTP token."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user or not user.totp_secret:
                    return False
                
                # Verify token
                totp = pyotp.TOTP(user.totp_secret)
                if totp.verify(token):
                    # If not already enabled, enable 2FA now
                    if not user.totp_enabled:
                        user.totp_enabled = True
                        db.commit()
                    return True
                return False
        except Exception as e:
            print(f"Error verifying TOTP: {e}")
            return False

    def is_totp_enabled(self, username: str) -> bool:
        """Check if TOTP is enabled for a user."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    return False
                
                return user.totp_enabled
        except Exception as e:
            print(f"Error checking TOTP status: {e}")
            return False

    def disable_totp(self, username: str) -> bool:
        """Disable TOTP for a user."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    return False
                
                user.totp_enabled = False
                user.totp_secret = None
                db.commit()
                return True
        except Exception as e:
            print(f"Error disabling TOTP: {e}")
            return False