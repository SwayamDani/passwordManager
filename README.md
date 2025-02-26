# Password Security Assessment Tool

A cybersecurity project that helps users manage and assess the security of their passwords and online accounts.

## Features

- **Password Strength Analysis**: Evaluates passwords based on length, character diversity, and complexity
- **Data Breach Checking**: Checks if passwords have appeared in known data breaches via the Have I Been Pwned API
- **Account Management**: Securely stores and manages your account credentials
- **Password Reuse Detection**: Identifies when the same password is used across multiple accounts
- **2FA Tracking**: Helps you keep track of which accounts have two-factor authentication enabled
- **Security Recommendations**: Provides actionable advice to improve your password security

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/password-security-assessment.git
   cd password-security-assessment
   ```

2. Install required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

Run the main script:
```
python password_manager.py
```

### First-time Users
1. Select "2" to register a new account
2. Enter your desired username and master password
3. Login with your credentials

### Returning Users
1. Select "1" to login
2. Enter your username and master password

### Available Options
After logging in, you can:
- **Check Password Strength**: Evaluate the security of any password
- **Check Password Breach**: See if a password has appeared in data breaches
- **Add Account**: Store credentials for a new service
- **View Accounts**: List all your stored accounts with security metrics
- **Edit Accounts**: Update usernames, passwords, or 2FA status
- **Delete Accounts**: Remove stored accounts

## Security Information

- All passwords are stored as SHA-256 hashes, not in plain text
- When checking for breaches, only the first 5 characters of the password hash are sent to the API (k-anonymity)
- The master password is never stored; only its hash is saved

## Requirements

- Python 3.6+
- Internet connection (for breach checking)
- Required packages:
  - requests
  - hashlib (standard library)
  - json (standard library)
  - re (standard library)
  - getpass (standard library)

## Project Structure

- `password_manager.py` - Main application file
- `users.json` - Stored user data and account information
- `requirements.txt` - Required Python packages

## Future Improvements

- Password generation functionality
- Export/import capabilities
- Offline mode for breach checking
- Enhanced encryption for stored data
- Browser integration for auto-filling credentials
- Mobile application
- Password expiration reminders

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational purposes and personal use. While it implements security best practices, no password manager can guarantee complete security. Always maintain backups of your important credentials.
