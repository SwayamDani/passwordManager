"""
Core Password Manager module integrating all components following SOLID principles.
This module serves as the main entry point for the password manager functionality.
"""

from .interfaces import IUserManager, IAccountManager, IPasswordAnalyzer, ICryptoProvider
from .user_manager import SQLUserManager
from .account_manager import SQLAccountManager
from .password_analyzer import PasswordAnalyzer
from .crypto import FernetCryptoProvider


class PasswordManagerFactory:
    """Factory for creating password manager components."""
    
    @staticmethod
    def create_crypto_provider() -> ICryptoProvider:
        """Create and return a crypto provider."""
        return FernetCryptoProvider()
    
    @staticmethod
    def create_user_manager(crypto_provider: ICryptoProvider = None) -> IUserManager:
        """Create and return a user manager."""
        if crypto_provider is None:
            crypto_provider = PasswordManagerFactory.create_crypto_provider()
        return SQLUserManager(crypto_provider)
    
    @staticmethod
    def create_password_analyzer() -> IPasswordAnalyzer:
        """Create and return a password analyzer."""
        return PasswordAnalyzer()
    
    @staticmethod
    def create_account_manager(
        user_manager: IUserManager = None,
        password_analyzer: IPasswordAnalyzer = None,
        crypto_provider: ICryptoProvider = None
    ) -> IAccountManager:
        """Create and return an account manager."""
        if crypto_provider is None:
            crypto_provider = PasswordManagerFactory.create_crypto_provider()
        if user_manager is None:
            user_manager = PasswordManagerFactory.create_user_manager(crypto_provider)
        if password_analyzer is None:
            password_analyzer = PasswordManagerFactory.create_password_analyzer()
        return SQLAccountManager(user_manager, password_analyzer, crypto_provider)


class PasswordManager:
    """Main password manager class integrating all components."""
    
    def __init__(
        self,
        user_manager: IUserManager = None,
        account_manager: IAccountManager = None,
        password_analyzer: IPasswordAnalyzer = None,
        crypto_provider: ICryptoProvider = None
    ):
        # Use the factory to create components if not provided
        self.crypto_provider = crypto_provider or PasswordManagerFactory.create_crypto_provider()
        self.user_manager = user_manager or PasswordManagerFactory.create_user_manager(self.crypto_provider)
        self.password_analyzer = password_analyzer or PasswordManagerFactory.create_password_analyzer()
        self.account_manager = account_manager or PasswordManagerFactory.create_account_manager(
            self.user_manager,
            self.password_analyzer,
            self.crypto_provider
        )
    
    # User management methods delegated to user_manager
    
    def create_user(self, username: str, password: str) -> bool:
        """Create a new user."""
        return self.user_manager.create_user(username, password)
    
    def login(self, username: str, password: str) -> bool:
        """Authenticate a user."""
        return self.user_manager.login(username, password)
    
    def delete_user(self, username: str) -> bool:
        """Delete a user."""
        return self.user_manager.delete_user(username)
    
    def generate_totp_secret(self, username: str) -> str:
        """Generate a TOTP secret for a user."""
        return self.user_manager.generate_totp_secret(username)
    
    def get_totp_qr_code(self, username: str) -> str:
        """Get the QR code for TOTP setup."""
        return self.user_manager.get_totp_qr_code(username)
    
    def verify_totp(self, username: str, token: str) -> bool:
        """Verify a TOTP token."""
        return self.user_manager.verify_totp(username, token)
    
    def is_totp_enabled(self, username: str) -> bool:
        """Check if TOTP is enabled for a user."""
        return self.user_manager.is_totp_enabled(username)
    
    def disable_totp(self, username: str) -> bool:
        """Disable TOTP for a user."""
        return self.user_manager.disable_totp(username)
    
    # Account management methods delegated to account_manager
    
    def get_accounts(self, username: str) -> dict:
        """Get all accounts for a user."""
        return self.account_manager.get_accounts(username)
    
    def check_password_age(self, username: str) -> list:
        """Check for passwords that are too old."""
        return self.account_manager.check_password_age(username)
    
    def add_account(self, username: str, service: str, account_username: str, password: str, has_2fa: bool = False) -> bool:
        """Add a new account."""
        return self.account_manager.add_account(username, service, account_username, password, has_2fa)
    
    def update_account(self, username: str, service: str, new_username: str = None, new_password: str = None, new_has_2fa: bool = None) -> bool:
        """Update an existing account."""
        return self.account_manager.update_account(username, service, new_username, new_password, new_has_2fa)
    
    def delete_account(self, username: str, service: str) -> bool:
        """Delete an account."""
        return self.account_manager.delete_account(username, service)
    
    # Password analysis methods delegated to password_analyzer
    
    def generate_password(self, length: int = 16) -> str:
        """Generate a secure random password."""
        return self.password_analyzer.generate_password(length)
    
    def check_password_strength(self, password: str) -> tuple:
        """Check the strength of a password."""
        return self.password_analyzer.check_strength(password)
    
    def check_password_breach(self, password: str) -> tuple:
        """Check if a password has been exposed in data breaches."""
        return self.password_analyzer.check_breach(password)