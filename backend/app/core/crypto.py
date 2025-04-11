"""
Cryptography utilities for password encryption/decryption.
"""

import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from .interfaces import ICryptoProvider


def generate_key_from_password(password: str, salt: bytes = None) -> tuple:
    """Generate a Fernet key from a password using PBKDF2."""
    if salt is None:
        salt = os.urandom(16)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key, salt


def encrypt_password(password: str, key: bytes) -> str:
    """Encrypt a password using Fernet symmetric encryption."""
    f = Fernet(key)
    return f.encrypt(password.encode()).decode()


def decrypt_password(encrypted_password: str, key: bytes) -> str:
    """Decrypt a password using Fernet symmetric encryption."""
    f = Fernet(key)
    return f.decrypt(encrypted_password.encode()).decode()


class FernetCryptoProvider(ICryptoProvider):
    """Implementation of ICryptoProvider using Fernet symmetric encryption."""
    
    def generate_key(self, password: str, salt: bytes = None) -> tuple:
        """Generate a Fernet key from a password using PBKDF2."""
        return generate_key_from_password(password, salt)
    
    def encrypt(self, data: str, key: bytes) -> str:
        """Encrypt data using Fernet symmetric encryption."""
        return encrypt_password(data, key)
    
    def decrypt(self, encrypted_data: str, key: bytes) -> str:
        """Decrypt data using Fernet symmetric encryption."""
        return decrypt_password(encrypted_data, key)