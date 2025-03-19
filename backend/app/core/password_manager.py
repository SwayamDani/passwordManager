"""
Core Password Manager module with SQLite database integration.
This module handles user management, password analysis, and account management
using SQLAlchemy and SQLite instead of JSON files.
"""

import re
import hashlib
import requests
from typing import Dict, List, Tuple, Optional
import json
import os
from datetime import datetime, timedelta
import random
import string
from sqlalchemy.orm import Session
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError
from .models import User, Account, setup_database

# Initialize database
engine, SessionLocal = setup_database()

class UserManager:
    """Manages user authentication and user data using SQLite database."""
    
    def __init__(self):
        self.salt_length = 32
        self._current_user = None
        
    @property
    def current_user(self) -> Optional[str]:
        return self._current_user
        
    @current_user.setter
    def current_user(self, username: str):
        self._current_user = username
    
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
    
    def hash_password(self, password: str, salt: bytes) -> str:
        """Hash a password with the provided salt."""
        password_bytes = password.encode()
        hash_obj = hashlib.sha256()
        hash_obj.update(salt)
        hash_obj.update(password_bytes)
        return hash_obj.hexdigest()
    
    def create_user(self, username: str, password: str) -> bool:
        """Create a new user in the database."""
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
                    salt=salt.hex()  # Store salt as hex string
                )
                
                db.add(new_user)
                db.commit()
                return True
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
                salt = bytes.fromhex(user.salt)
                password_hash = self.hash_password(password, salt)
                
                if password_hash == user.password:
                    self._current_user = username
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


class PasswordAnalyzer:
    """Analyzes password strength and checks for breaches."""
    
    def __init__(self):
        self.min_length = 8
        self.api_url = "https://api.pwnedpasswords.com/range/"
    
    def generate_password(self, length: int = 16) -> str:
        """Generate a secure random password."""
        if length < self.min_length:
            length = self.min_length
            
        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        special = "!@#$%^&*(),.?\":{}|<>_"
        
        # Ensure at least one character from each category
        password = [
            random.choice(lowercase),
            random.choice(uppercase),
            random.choice(digits),
            random.choice(special)
        ]
        
        # Fill the rest with random chars from all categories
        all_chars = lowercase + uppercase + digits + special
        password.extend(random.choice(all_chars) for _ in range(length - 4))
        
        # Shuffle the password characters
        random.shuffle(password)
        return ''.join(password)
    
    def check_strength(self, password: str) -> Tuple[int, List[str]]:
        """Check the strength of a password and return a score and feedback."""
        score = 0
        feedback = []
        
        # Check length
        if len(password) >= self.min_length:
            score += 1
        else:
            feedback.append(f"Password should be at least {self.min_length} characters long")
        
        # Check for uppercase letters
        if re.search(r'[A-Z]', password):
            score += 1
        else:
            feedback.append("Add uppercase letters")
        
        # Check for lowercase letters
        if re.search(r'[a-z]', password):
            score += 1
        else:
            feedback.append("Add lowercase letters")
        
        # Check for digits
        if re.search(r'\d', password):
            score += 1
        else:
            feedback.append("Add numbers")
        
        # Check for special characters
        if re.search(r'[!@#$%^&*(),.?":{}|<>_]', password):
            score += 1
        else:
            feedback.append("Add special characters")
        
        return score, feedback
    
    def check_breach(self, password: str) -> Tuple[bool, int]:
        """Check if a password has been exposed in data breaches."""
        # Hash the password with SHA-1
        sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
        hash_prefix = sha1_hash[:5]
        hash_suffix = sha1_hash[5:]
        
        try:
            # Query the Pwned Passwords API with k-anonymity
            response = requests.get(self.api_url + hash_prefix)
            if response.status_code == 200:
                hashes = (line.split(':') for line in response.text.splitlines())
                for h, count in hashes:
                    if h == hash_suffix:
                        return True, int(count)
            return False, 0
        except requests.RequestException:
            # Fail gracefully if the API is not available
            return False, 0


class AccountManager:
    """Manages user account data in the SQLite database."""
    
    def __init__(self, user_manager: UserManager):
        self.user_manager = user_manager
        self.analyzer = PasswordAnalyzer()
    
    def get_accounts(self, username: str) -> Dict:
        """Get all accounts for a user."""
        return self.user_manager.get_user_accounts(username)
    
    def check_password_age(self, username: str) -> List[Dict]:
        """Check for passwords older than 90 days."""
        aging_passwords = []
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    return []
                
                current_time = datetime.utcnow()
                ninety_days_ago = current_time - timedelta(days=90)
                
                old_accounts = db.query(Account).filter(
                    and_(
                        Account.user_id == user.id,
                        Account.last_changed < ninety_days_ago
                    )
                ).all()
                
                for account in old_accounts:
                    days_old = (current_time - account.last_changed).days
                    aging_passwords.append({
                        "service": account.service,
                        "days_old": days_old
                    })
                    
                return aging_passwords
        except Exception as e:
            print(f"Error checking password age: {e}")
            return []
    
    def add_account(
        self, 
        username: str, 
        service: str, 
        account_username: str, 
        password: str, 
        has_2fa: bool = False
    ) -> bool:
        """Add a new account for a user."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    return False
                
                # Check if service already exists for this user
                existing_account = db.query(Account).filter(
                    and_(
                        Account.user_id == user.id,
                        Account.service == service
                    )
                ).first()
                
                if existing_account:
                    return False
                
                # Check password strength and breaches
                strength_score, _ = self.analyzer.check_strength(password)
                is_breached, _ = self.analyzer.check_breach(password)
                
                # Create new account
                new_account = Account(
                    user_id=user.id,
                    service=service,
                    username=account_username,
                    password=password,
                    has_2fa=has_2fa,
                    last_changed=datetime.utcnow(),
                    password_strength=strength_score,
                    password_breach=is_breached
                )
                
                db.add(new_account)
                db.commit()
                return True
        except IntegrityError:
            # Handle unique constraint violation
            return False
        except Exception as e:
            print(f"Error adding account: {e}")
            return False
    
    def update_account(
        self,
        username: str,
        service: str,
        new_username: str = None,
        new_password: str = None,
        new_has_2fa: bool = None
    ) -> bool:
        """Update an existing account for a user."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    return False
                
                account = db.query(Account).filter(
                    and_(
                        Account.user_id == user.id,
                        Account.service == service
                    )
                ).first()
                
                if not account:
                    return False
                
                # Update account fields if provided
                if new_username is not None:
                    account.username = new_username
                
                if new_password is not None:
                    account.password = new_password
                    account.last_changed = datetime.utcnow()
                    
                    # Update password analysis
                    strength_score, _ = self.analyzer.check_strength(new_password)
                    is_breached, _ = self.analyzer.check_breach(new_password)
                    account.password_strength = strength_score
                    account.password_breach = is_breached
                
                if new_has_2fa is not None:
                    account.has_2fa = new_has_2fa
                
                db.commit()
                return True
        except Exception as e:
            print(f"Error updating account: {e}")
            return False
    
    def delete_account(self, username: str, service: str) -> bool:
        """Delete an account for a user."""
        try:
            with SessionLocal() as db:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    return False
                
                account = db.query(Account).filter(
                    and_(
                        Account.user_id == user.id,
                        Account.service == service
                    )
                ).first()
                
                if not account:
                    return False
                
                db.delete(account)
                db.commit()
                return True
        except Exception as e:
            print(f"Error deleting account: {e}")
            return False