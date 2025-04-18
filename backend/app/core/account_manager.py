"""
Account management module for the password manager application.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError

from .interfaces import IAccountManager, IUserManager, IPasswordAnalyzer, ICryptoProvider
from .database import SessionLocal
from .models import User, Account


class SQLAccountManager(IAccountManager):
    """Implementation of IAccountManager using SQLAlchemy and SQLite."""
    
    def __init__(
        self, 
        user_manager: IUserManager, 
        password_analyzer: IPasswordAnalyzer,
        crypto_provider: ICryptoProvider
    ):
        self.user_manager = user_manager
        self.analyzer = password_analyzer
        self.crypto_provider = crypto_provider
    
    def get_accounts(self, username: str) -> Dict:
        """Get all accounts for a user with decrypted passwords."""
        encrypted_accounts = self.user_manager.get_user_accounts(username)
        if not encrypted_accounts:
            return {}
        
        # Get encryption key
        encryption_key = self.user_manager.get_encryption_key(username, self.user_manager.current_password)
        if encryption_key is None:
            print(f"Failed to get encryption key for user {username}")
            return {}
        
        # Decrypt passwords
        decrypted_accounts = {}
        for service, account in encrypted_accounts.items():
            decrypted_account = account.copy()
            try:
                # Try to decrypt, assuming it's encrypted
                decrypted_account['password'] = self.crypto_provider.decrypt(account['password'], encryption_key)
            except Exception as e:
                print(f"Decryption error for service {service}: {str(e)}")
                # If decryption fails, leave as is (for backwards compatibility)
                decrypted_account['password'] = account['password']
            decrypted_accounts[service] = decrypted_account
        
        return decrypted_accounts
    
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
                
                # Get encryption key
                encryption_key = self.user_manager.get_encryption_key(username, self.user_manager.current_password)
                
                # Check if encryption key is available
                if encryption_key is None:
                    import logging
                    logging.error(f"Failed to get encryption key for user {username}. Current password might be None.")
                    return False
                
                # Encrypt the password
                encrypted_password = self.crypto_provider.encrypt(password, encryption_key)
                
                # Check password strength and breaches
                strength_score, _ = self.analyzer.check_strength(password)
                is_breached, _ = self.analyzer.check_breach(password)
                
                # Create new account
                new_account = Account(
                    user_id=user.id,
                    service=service,
                    username=account_username,
                    password=encrypted_password,  # Store encrypted password
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
                    # Get encryption key
                    encryption_key = self.user_manager.get_encryption_key(username, self.user_manager.current_password)
                    
                    # Check if encryption key is available
                    if encryption_key is None:
                        import logging
                        logging.error(f"Failed to get encryption key for user {username}. Current password might be None.")
                        return False
                    
                    # Encrypt new password
                    encrypted_password = self.crypto_provider.encrypt(new_password, encryption_key)
                    account.password = encrypted_password
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