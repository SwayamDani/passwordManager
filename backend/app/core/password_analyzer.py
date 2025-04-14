"""
Password analyzer module for checking password strength and breaches.
"""

import re
import hashlib
import requests
import random
import string
from typing import Tuple, List
from .interfaces import IPasswordAnalyzer


class PasswordAnalyzer(IPasswordAnalyzer):
    """Analyzes password strength and checks for breaches."""
    
    def __init__(self, min_length=8, api_url="https://api.pwnedpasswords.com/range/"):
        self.min_length = min_length
        self.api_url = api_url
    
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