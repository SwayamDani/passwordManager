import pyotp
import qrcode
import base64
import io
import secrets
import string
from datetime import datetime, timedelta
from typing import Tuple, Dict, Optional

class TwoFactorAuth:
    @staticmethod
    def generate_totp_secret() -> str:
        """Generate a new TOTP secret key"""
        return pyotp.random_base32()
    
    @staticmethod
    def get_totp_uri(secret: str, username: str, issuer: str = "Password Manager") -> str:
        """Generate a TOTP URI for QR code generation"""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(username, issuer_name=issuer)
    
    @staticmethod
    def generate_qr_code(totp_uri: str) -> str:
        """Generate a QR code image as base64 string for the TOTP URI"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered)
        return base64.b64encode(buffered.getvalue()).decode()
    
    @staticmethod
    def verify_totp(secret: str, token: str) -> bool:
        """Verify a TOTP token against a secret"""
        if not secret or not token:
            return False
        
        totp = pyotp.TOTP(secret)
        # Allow for slight time sync issues with a window of 1 unit (±30 sec)
        return totp.verify(token, valid_window=1)

class PasswordReset:
    @staticmethod
    def generate_reset_token() -> str:
        """Generate a secure token for password reset"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(64))
    
    @staticmethod
    def get_token_expiration() -> datetime:
        """Get expiration time for reset token (30 minutes from now)"""
        return datetime.utcnow() + timedelta(minutes=1)
    
    @staticmethod
    def is_token_valid(expiration_time: datetime) -> bool:
        """Check if a token is still valid based on expiration time"""
        if not expiration_time:
            return False
        return datetime.utcnow() <= expiration_time