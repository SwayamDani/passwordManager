import re
import hashlib
import requests
from typing import Dict, List, Tuple
from getpass import getpass
import json
import os
from datetime import datetime

class UserManager:
    def __init__(self):
        self.users_file = os.path.join(os.path.dirname(__file__), 'users.json')
        self.current_user = None
        self.load_users()

    def load_users(self):
        if os.path.exists(self.users_file):
            with open(self.users_file, 'r') as f:
                self.users = json.load(f)
        else:
            self.users = {}

    def save_users(self):
        with open(self.users_file, 'w') as f:
            json.dump(self.users, f, indent=4)

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

    def check_strength(self, password: str) -> Tuple[int, List[str]]:
        score = 0
        feedback = []

        # Check length
        if len(password) >= self.min_length:
            score += 1
        else:
            feedback.append(f"Password should be at least {self.min_length} characters long")

        # Check for uppercase
        if re.search(r'[A-Z]', password):
            score += 1
        else:
            feedback.append("Add uppercase letters")

        # Check for lowercase
        if re.search(r'[a-z]', password):
            score += 1
        else:
            feedback.append("Add lowercase letters")

        # Check for numbers
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

def main():
    user_manager = UserManager()
    analyzer = PasswordAnalyzer()
    account_manager = AccountManager(user_manager)  # Fix: pass user_manager

    while True:
        if not user_manager.current_user:
            print("\nPassword Manager Login")
            print("1. Login")
            print("2. Register")
            print("3. Exit")
            
            choice = input("\nEnter your choice (1-3): ")
            
            if choice == '1':
                username = input("Username: ")
                password = getpass("Password: ")
                if user_manager.login(username, password):
                    print("\nLogin successful!")
                else:
                    print("\nInvalid username or password!")
                    
            elif choice == '2':
                username = input("Choose username: ")
                password = getpass("Choose password: ")
                if user_manager.register(username, password):
                    print("\nRegistration successful! Please login.")
                else:
                    print("\nUsername already exists!")
                    
            elif choice == '3':
                print("Thank you for using Password Security Assessment Tool!")
                break
            
            continue

        os.system('cls' if os.name == 'nt' else 'clear')
        print(f"\nWelcome, {user_manager.current_user}!")
        print("Password Security Assessment Tool")
        print("1. Check password strength")
        print("2. Check password breach")
        print("3. Add account")
        print("4. View accounts")
        print("5. Logout")
        print("6. Exit")

        choice = input("\nEnter your choice (1-6): ")  # Fix: changed to 1-6

        if choice == '1':
            password = getpass("Enter password to check: ")
            score, feedback = analyzer.check_strength(password)
            print(f"\nStrength Score: {score}/5")
            if feedback:
                print("Improvements needed:")
                for item in feedback:
                    print(f"- {item}")
            else:
                print("Good news! Your password is strong.")
            input("\nPress Enter to continue..." )
                
        elif choice == '2':
            password = getpass("Enter password to check: ")
            is_breached, count = analyzer.check_breach(password)
            if is_breached:
                print(f"\nWARNING: This password has been found in {count} data breaches!")
            else:
                print("\nGood news! This password hasn't been found in any known data breaches.")
            input("\nPress Enter to continue..." )

        elif choice == '3':
            service = input("Enter service name: ")
            username = input("Enter username: ")
            password = getpass("Enter password: ")
            has_2fa = input("Does this account have 2FA? (y/n): ").lower() == 'y'
            if account_manager.add_account(service, username, password, has_2fa):
                print("\nAccount added successfully!")
            else:
                print("\nError adding account!")
            input("\nPress Enter to continue..." )

        elif choice == '4':
            accounts = account_manager.list_accounts()
            os.system('cls' if os.name == 'nt' else 'clear')
            if accounts:
                print("\nYour accounts:")
                for service, details in accounts.items():
                    print(f"\nService: {service}")
                    print(f"Username: {details['username']}")
                    print(f"Password Strength: {details['password_strength']}/5")
                    print(f"Password Breach: {'Yes' if details['password_breach'] else 'No'}")
                    print(f"Password Reuse: {', '.join(details['password_reuse'])}")
                    print(f"2FA Enabled: {'Yes' if details['has_2fa'] else 'No'}")
                    print(f"Last Changed: {details['last_changed']}")

                userInput = input("\nDo you want to edit an account? (y/n): ")
                if userInput.lower() == 'y':
                    service = input("Enter service name: ")
                    input("\nPress Enter to continue..." )
                    if service in accounts:
                        print("\nService: {service}")
                        print(f"1. Change Username {accounts[service]['username']}")
                        print(f"2. Change Password")
                        print(f"3. Change 2FA {accounts[service]['has_2fa']}")
                        print("4. Delete Account")
                        print("5. Back")
                        choice = input("\nEnter your choice (1-3): ")
                        if choice == '1':
                            username = input("Enter new username: ")
                            accounts[service]['username'] = username
                            user_manager.save_users()
                            print("\nUsername updated successfully!")
                        elif choice == '2':
                            password = getpass("Enter current password: ")
                            if hashlib.sha256(password.encode()).hexdigest() != accounts[service]['password']:
                                print("\033[91mIncorrect password!\033[0m") 
                                while True:
                                    choice = input("\nEnter 1 to retry or 2 to go back: ")
                                    if choice == '1':
                                        password = getpass("Enter current password: ")
                                        if hashlib.sha256(password.encode()).hexdigest() != accounts[service]['password']:
                                            print("\033[91mIncorrect password!\033[0m") 
                                            continue
                                        else:
                                            break
                                    elif choice == '2':
                                        break
                                    else:
                                        print("\nInvalid choice!")
                                continue
                            password = getpass("Enter new password: ")
                            accounts[service]['password'] = hashlib.sha256(password.encode()).hexdigest()
                            accounts[service]['password_breach'] = analyzer.check_breach(password)[0]
                            accounts[service]['password_reuse'] = account_manager.check_password_reuse(password)
                            accounts[service]['password_strength'] = analyzer.check_strength(password)[0]
                            accounts[service]['last_changed'] = datetime.now().isoformat()
                            user_manager.save_users()
                            print("\nPassword updated successfully!")
                        elif choice == '3':
                            has_2fa = input("Does this account have 2FA? (y/n): ").lower() == 'y'
                            accounts[service]['has_2fa'] = has_2fa
                            user_manager.save_users()
                            print("\n2FA updated successfully!")
                        elif choice == '4':
                            del accounts[service]
                            user_manager.save_users()
                            print("\nAccount deleted successfully!")
                        elif choice == '5':
                            continue
                        else:
                            print("\nInvalid choice!")
            else:
                print("\nNo accounts found!")
            input("\nPress Enter to continue..." )

        elif choice == '5':
            user_manager.current_user = None
            print("\nLogged out successfully!")
            break

        elif choice == '6':
            print("Thank you for using Password Security Assessment Tool!")
            break

if __name__ == "__main__":
    main()