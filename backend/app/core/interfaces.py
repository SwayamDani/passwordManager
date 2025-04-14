"""
Interfaces for the password manager application.
These abstract base classes define the contracts that implementations must follow.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional, Any


class IUserManager(ABC):
    """Interface for user management operations."""
    
    @abstractmethod
    def create_user(self, username: str, password: str) -> bool:
        """Create a new user."""
        pass
        
    @abstractmethod
    def login(self, username: str, password: str) -> bool:
        """Authenticate a user."""
        pass
    
    @abstractmethod
    def delete_user(self, username: str) -> bool:
        """Delete a user."""
        pass
    
    @abstractmethod
    def get_encryption_key(self, username: str, password: str) -> bytes:
        """Get the encryption key for a user."""
        pass
    
    @abstractmethod
    def generate_totp_secret(self, username: str) -> str:
        """Generate a new TOTP secret for a user."""
        pass
    
    @abstractmethod
    def get_totp_qr_code(self, username: str) -> str:
        """Get the QR code for TOTP setup."""
        pass
    
    @abstractmethod
    def verify_totp(self, username: str, token: str) -> bool:
        """Verify a TOTP token."""
        pass
    
    @abstractmethod
    def is_totp_enabled(self, username: str) -> bool:
        """Check if TOTP is enabled for a user."""
        pass
    
    @abstractmethod
    def disable_totp(self, username: str) -> bool:
        """Disable TOTP for a user."""
        pass


class IPasswordAnalyzer(ABC):
    """Interface for password analysis operations."""
    
    @abstractmethod
    def generate_password(self, length: int = 16) -> str:
        """Generate a secure random password."""
        pass
        
    @abstractmethod
    def check_strength(self, password: str) -> Tuple[int, List[str]]:
        """Check the strength of a password."""
        pass
    
    @abstractmethod
    def check_breach(self, password: str) -> Tuple[bool, int]:
        """Check if a password has been exposed in data breaches."""
        pass


class IAccountManager(ABC):
    """Interface for account management operations."""
    
    @abstractmethod
    def get_accounts(self, username: str) -> Dict:
        """Get all accounts for a user."""
        pass
        
    @abstractmethod
    def check_password_age(self, username: str) -> List[Dict]:
        """Check for passwords that are too old."""
        pass
    
    @abstractmethod
    def add_account(
        self, 
        username: str, 
        service: str, 
        account_username: str, 
        password: str, 
        has_2fa: bool = False
    ) -> bool:
        """Add a new account."""
        pass
    
    @abstractmethod
    def update_account(
        self,
        username: str,
        service: str,
        new_username: str = None,
        new_password: str = None,
        new_has_2fa: bool = None
    ) -> bool:
        """Update an existing account."""
        pass
    
    @abstractmethod
    def delete_account(self, username: str, service: str) -> bool:
        """Delete an account."""
        pass


class ICryptoProvider(ABC):
    """Interface for cryptographic operations."""
    
    @abstractmethod
    def generate_key(self, password: str, salt: bytes = None) -> Tuple[bytes, bytes]:
        """Generate an encryption key from a password."""
        pass
        
    @abstractmethod
    def encrypt(self, data: str, key: bytes) -> str:
        """Encrypt data."""
        pass
    
    @abstractmethod
    def decrypt(self, encrypted_data: str, key: bytes) -> str:
        """Decrypt data."""
        pass
        
    @abstractmethod
    def get_key_from_salt(self, salt: bytes) -> bytes:
        """Get an encryption key from a salt only (for recovery purposes)."""
        pass