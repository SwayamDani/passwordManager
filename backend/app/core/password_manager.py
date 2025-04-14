<<<<<<< HEAD
import re
import hashlib
import requests
from typing import Dict, List, Tuple, Optional
from getpass import getpass
import json
import os
from datetime import datetime, timedelta
import random
import string
from cryptography.fernet import Fernet
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from pathlib import Path
from app.config import settings
import secrets

SECURITY_PARAMS = {
    'PBKDF2_ITERATIONS': 600000,
    'SALT_SIZE': 32,
    'KEY_SIZE': 32
}

# Define data directory paths
DATA_DIR = Path(__file__).parent.parent.parent / "data"
USERS_FILE = DATA_DIR / "users.json"
SALT_FILE = DATA_DIR / ".salt"

# Create data directory if it doesn't exist
DATA_DIR.mkdir(exist_ok=True)

class UserManager:
    def __init__(self):
        self.users: Dict = {}
        self.salt_length = 32
        self.salt_path = Path(__file__).parent.parent.parent / "data" / ".salt"
        self._ensure_salt_file()
        self.load_users()
        self._current_user = None

    @property
    def current_user(self) -> Optional[str]:
        return self._current_user

    @current_user.setter
    def current_user(self, username: str):
        self._current_user = username

    def get_user_accounts(self, username: str) -> Dict:
        if username not in self.users:
            return {}
        return self.users[username].get('accounts', {})

    def _ensure_salt_file(self):
        """Ensure the salt file exists and create if it doesn't"""
        self.salt_path.parent.mkdir(exist_ok=True)
        if not self.salt_path.exists():
            with open(self.salt_path, 'wb') as f:
                f.write(secrets.token_bytes(self.salt_length))

    def get_salt(self) -> bytes:
        """Get the global salt from file"""
        with open(self.salt_path, 'rb') as f:
            return f.read()

    def hash_password(self, password: str, salt: bytes) -> str:
        """Hash a password with the provided salt"""
        password_bytes = password.encode()
        hash_obj = hashlib.sha256()
        hash_obj.update(salt)
        hash_obj.update(password_bytes)
        return hash_obj.hexdigest()

    def create_user(self, username: str, password: str) -> bool:
        """Create a new user with hashed password"""
        if username in self.users:
            return False
        
        salt = self.get_salt()
        password_hash = self.hash_password(password, salt)
        
        self.users[username] = {
            "password": password_hash,
            "accounts": {},
            "salt": salt.hex()  # Store salt as hex string
        }
        self.save_users()
        return True

    def _initialize_encryption(self):
        if os.path.exists(self.salt_file):
            with open(self.salt_file, 'rb') as f:
                self.salt = f.read()
        else:
            self.salt = os.urandom(SECURITY_PARAMS['SALT_SIZE'])
            with open(self.salt_file, 'wb') as f:
                f.write(self.salt)

        if os.path.exists(self.key_file):
            with open(self.key_file, 'rb') as f:
                self.key = f.read()
        else:
            master_password = getpass("Enter master password for encryption: ")
            self.key = self._generate_key(master_password)
            with open(self.key_file, 'wb') as f:
                f.write(self.key)
        
        self.fernet = Fernet(self.key)

    def _generate_key(self, password: str) -> bytes:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=SECURITY_PARAMS['KEY_SIZE'],
            salt=self.salt,
            iterations=SECURITY_PARAMS['PBKDF2_ITERATIONS'],
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key

    def validate_master_password(self, password: str) -> bool:
        try:
            test_key = self._generate_key(password)
            return test_key == self.key
        except Exception:
            return False

    def load_users(self):
        """Load users from JSON file"""
        users_file = Path(__file__).parent.parent.parent / "data" / "users.json"
        if users_file.exists():
            try:
                with open(users_file, 'r') as f:
                    content = f.read()
                    if content:
                        self.users = json.loads(content)
                    else:
                        self.users = {}
            except json.JSONDecodeError:
                self.users = {}
        else:
            # Create empty users file
            users_file.parent.mkdir(exist_ok=True)
            with open(users_file, 'w') as f:
                json.dump({}, f)
            self.users = {}

    def save_users(self):
        """Save users to JSON file"""
        users_file = Path(__file__).parent.parent.parent / "data" / "users.json"
        users_file.parent.mkdir(exist_ok=True)
        with open(users_file, 'w') as f:
            json.dump(self.users, f, indent=4)

    def login(self, username: str, password: str) -> bool:
        """Verify login credentials"""
        if username not in self.users:
            return False
        
        stored_hash = self.users[username]["password"]
        salt = bytes.fromhex(self.users[username]["salt"])
        password_hash = self.hash_password(password, salt)
        
        return password_hash == stored_hash

    def register(self, username: str, password: str) -> bool:
        if username in self.users:
            return False
        self.users[username] = {
            'password': hashlib.sha256(password.encode()).hexdigest(),
            'accounts': {}
        }
        self.save_users()
        return True

    def delete_user(self, username: str) -> bool:
        if username not in self.users:
            return False
        
        del self.users[username]
        self.save_users()
        return True

class PasswordAnalyzer:
    def __init__(self):
        self.min_length = 8
        self.api_url = "https://api.pwnedpasswords.com/range/"

    def generate_password(self, length: int = 16) -> str:
        if length < self.min_length:
            length = self.min_length
            
        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        special = "!@#$%^&*(),.?\":{}|<>_"
        
        password = [
            random.choice(lowercase),
            random.choice(uppercase),
            random.choice(digits),
            random.choice(special)
        ]
        
        all_chars = lowercase + uppercase + digits + special
        password.extend(random.choice(all_chars) for _ in range(length - 4))
        
        random.shuffle(password)
        return ''.join(password)

    def check_strength(self, password: str) -> Tuple[int, List[str]]:
        score = 0
        feedback = []

        if len(password) >= self.min_length:
            score += 1
        else:
            feedback.append(f"Password should be at least {self.min_length} characters long")

        if re.search(r'[A-Z]', password):
            score += 1
        else:
            feedback.append("Add uppercase letters")

        if re.search(r'[a-z]', password):
            score += 1
        else:
            feedback.append("Add lowercase letters")

        if re.search(r'\d', password):
            score += 1
        else:
            feedback.append("Add numbers")

        if re.search(r'[!@#$%^&*(),.?":{}|<>_]', password):
            score += 1
        else:
            feedback.append("Add special characters")

        return score, feedback

    def check_breach(self, password: str) -> Tuple[bool, int]:
        sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
        hash_prefix = sha1_hash[:5]
        hash_suffix = sha1_hash[5:]

        try:
            response = requests.get(self.api_url + hash_prefix)
            if response.status_code == 200:
                hashes = (line.split(':') for line in response.text.splitlines())
                for h, count in hashes:
                    if h == hash_suffix:
                        return True, int(count)
            return False, 0
        except requests.RequestException:
            return False, 0

class AccountManager:
    def __init__(self, user_manager: UserManager):
        self.user_manager = user_manager
        self.analyzer = PasswordAnalyzer()

    def get_accounts(self, username: str) -> Dict:
        """Get all accounts for a user"""
        return self.user_manager.get_user_accounts(username)

    def check_password_age(self, username: str) -> List[Dict]:
        """Check for passwords older than 90 days"""
        aging_passwords = []
        try:
            accounts = self.user_manager.get_user_accounts(username)
            current_time = datetime.now()
            
            for service, details in accounts.items():
                try:
                    last_changed = datetime.fromisoformat(details.get('last_changed', current_time.isoformat()))
                    age = (current_time - last_changed).days
                    
                    if age >= 90:
                        aging_passwords.append({
                            "service": service,
                            "days_old": age
                        })
                except (ValueError, TypeError) as e:
                    continue
                    
            return aging_passwords
        except Exception as e:
            print(f"Error checking password age: {e}")
            return []

    def add_account(self, username: str, service: str, account_username: str, password: str, has_2fa: bool = False) -> bool:
        try:
            if username not in self.user_manager.users:
                return False
                
            user_data = self.user_manager.users[username]
            if 'accounts' not in user_data:
                user_data['accounts'] = {}
                
            # Check password strength and breaches
            strength_score, _ = self.analyzer.check_strength(password)
            is_breached, _ = self.analyzer.check_breach(password)
            
            user_data['accounts'][service] = {
                'username': account_username,
                'password': password,
                'has_2fa': has_2fa,
                'last_changed': datetime.now().isoformat(),
                'password_strength': strength_score,
                'password_breach': is_breached
            }
            
            self.user_manager.save_users()
            return True
        except Exception as e:
            print(f"Error adding account: {e}")
            return False

    def list_accounts(self) -> List[Dict]:
        if not self.user_manager.current_user:
            return []
        return self.user_manager.users[self.user_manager.current_user]['accounts']

    def check_password_reuse(self, password: str) -> List[str]:
        reused_in = []
        if self.user_manager.current_user:
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            accounts = self.user_manager.users[self.user_manager.current_user]['accounts']
            for service, details in accounts.items():
                if details['password'] == hashed_password:
                    reused_in.append(service)
        return reused_in

    def check_password_age(self, username: str) -> List[Dict]:
        aging_passwords = []
        try:
           accounts = self.user_manager.get_user_accounts(username)
           current_time = datetime.now()
           
           for service, details in accounts.items():
               try:
                   last_changed = datetime.fromisoformat(details.get('last_changed', current_time.isoformat()))
                   age = (current_time - last_changed).days
                   
                   if age >= 90:
                       aging_passwords.append({
                           "service": service,
                           "days_old": age
                       })
               except (ValueError, TypeError):
                   continue
                   
           return aging_passwords
        except Exception as e:
            print(f"Error checking password age: {e}")
            return []

    def update_account(
        self,
        username: str,
        service: str,
        new_username: str,
        new_password: str,
        new_has_2fa: bool
    ) -> bool:
        """Update an existing account for a user"""
        try:
            if username not in self.user_manager.users:
                return False
                
            user_data = self.user_manager.users[username]
            if 'accounts' not in user_data or service not in user_data['accounts']:
                return False
                
            account = user_data['accounts'][service]
            if new_username:
                account['username'] = new_username
            if new_password:
                account['password'] = new_password
                account['last_changed'] = datetime.now().isoformat()
                # Update password analysis
                strength_score, _ = self.analyzer.check_strength(new_password)
                is_breached, _ = self.analyzer.check_breach(new_password)
                account['password_strength'] = strength_score
                account['password_breach'] = is_breached
                
            account['has_2fa'] = new_has_2fa
            
            self.user_manager.save_users()
            return True
        except Exception as e:
            print(f"Error updating account: {e}")
            return False

    def delete_account(self, username: str, service: str) -> bool:
        """Delete an account for a user"""
        try:
            if username not in self.user_manager.users:
                return False
                
            user_data = self.user_manager.users[username]
            if 'accounts' not in user_data or service not in user_data['accounts']:
                return False
                
            del user_data['accounts'][service]
            self.user_manager.save_users()
            return True
        except Exception as e:
            print(f"Error deleting account: {e}")
            return False

=======
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
>>>>>>> 949fb09fb18e247f403e5f2fea1a9f7d0d907e6c
