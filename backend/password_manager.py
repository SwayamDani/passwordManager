import re
import hashlib
import requests
from typing import Dict, List, Tuple
from getpass import getpass
import json
import os
from datetime import datetime
import random
import string
from cryptography.fernet import Fernet
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

SECURITY_PARAMS = {
    'PBKDF2_ITERATIONS': 600000,
    'SALT_SIZE': 32,
    'KEY_SIZE': 32
}

class UserManager:
    def __init__(self):
        self.users_file = os.path.join(os.path.dirname(__file__), 'users.json')
        self.salt_file = os.path.join(os.path.dirname(__file__), '.salt')
        self.key_file = os.path.join(os.path.dirname(__file__), '.key')
        self.current_user = None
        self._initialize_encryption()
        self.load_users()

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
        if os.path.exists(self.users_file):
            with open(self.users_file, 'rb') as f:
                encrypted_data = f.read()
                if encrypted_data:
                    decrypted_data = self.fernet.decrypt(encrypted_data)
                    self.users = json.loads(decrypted_data)
                else:
                    self.users = {}
        else:
            self.users = {}

    def save_users(self):
        encrypted_data = self.fernet.encrypt(json.dumps(self.users).encode())
        with open(self.users_file, 'wb') as f:
            f.write(encrypted_data)

    def register(self, username: str, password: str) -> bool:
        if username in self.users:
            return False
        self.users[username] = {
            'password': hashlib.sha256(password.encode()).hexdigest(),
            'accounts': {}
        }
        self.save_users()
        return True

    def login(self, username: str, password: str) -> bool:
        if username in self.users and self.users[username]['password'] == hashlib.sha256(password.encode()).hexdigest():
            self.current_user = username
            return True
        return False

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
    analyzer = PasswordAnalyzer()
    def __init__(self, user_manager: UserManager):
        self.user_manager = user_manager

    def add_account(self, service: str, username: str, password: str, has_2fa: bool = False):
        if not self.user_manager.current_user:
            return False
        
        self.user_manager.users[self.user_manager.current_user]['accounts'][service] = {
            'username': username,
            'password': hashlib.sha256(password.encode()).hexdigest(),
            'password_breach': self.analyzer.check_breach(password)[0],
            'password_reuse': self.check_password_reuse(password),
            'password_strength': self.analyzer.check_strength(password)[0],
            'has_2fa': has_2fa,
            'last_changed': datetime.now().isoformat()
        }
        self.user_manager.save_users()
        return True

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

    def check_password_age(self) -> List[Tuple[str, int]]:
        """Returns list of (service, days_old) for passwords older than 90 days"""
        aging_passwords = []
        if self.user_manager.current_user:
            accounts = self.user_manager.users[self.user_manager.current_user]['accounts']
            for service, details in accounts.items():
                last_changed = datetime.fromisoformat(details['last_changed'])
                days_old = (datetime.now() - last_changed).days
                if days_old >= 90:  # Password is older than 90 days
                    aging_passwords.append((service, days_old))
        return aging_passwords

