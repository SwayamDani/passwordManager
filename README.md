# Password Security Assessment Tool

A comprehensive cybersecurity project that helps users manage and assess the security of their passwords and online accounts.

## Features

### Password Security Analysis
- **Strength Evaluation**: Advanced algorithm assesses password strength based on length, character diversity, and complexity
- **Data Breach Checking**: Secure API integration with Have I Been Pwned using k-anonymity
- **Password Reuse Detection**: Identifies when the same password is used across multiple accounts
- **Age Tracking**: Monitors how long passwords have been in use and suggests rotation

### Account Management
- **Encrypted Storage**: All sensitive data is encrypted using Fernet encryption
- **Secure Credential Storage**: Passwords are never stored in plain text (SHA-256 hashing)
- **2FA Tracking**: Keep track of which accounts have two-factor authentication enabled
- **Password Generation**: Create strong, random passwords that meet security requirements

### Modern Interface
- **Web Dashboard**: Intuitive UI to manage all your accounts and passwords
- **Visual Security Indicators**: Color-coded security status for all accounts
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

This project implements a full-stack architecture:

- **Backend**: Python FastAPI REST service with secure password handling
- **Frontend**: Next.js React application with Material UI components
- **Database**: File-based encrypted storage system

## Installation

### Prerequisites
- Python 3.6+
- Node.js 18+
- npm or yarn

### Backend Setup
1. Clone this repository:
   ```
   git clone https://github.com/yourusername/password-security-assessment.git
   cd password-security-assessment
   ```

2. Set up backend:
   ```
   cd backend
   pip install -r requirements.txt
   ```

### Frontend Setup
1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

## Usage

### Starting the Application
Use the provided scripts to start both frontend and backend:

#### Windows
```
start.bat
```

#### macOS/Linux
```
chmod +x start.sh
./start.sh
```

### Using the Application
1. Navigate to `http://localhost:3000` in your browser
2. Register a new account or login with existing credentials
3. Add and manage your accounts and passwords
4. Use the password generator to create strong, unique passwords
5. Monitor security status of all your accounts

## Security Information

- All passwords are stored as SHA-256 hashes, not in plain text
- User data files are encrypted using Fernet encryption
- When checking for breaches, only the first 5 characters of the password hash are sent to the API (k-anonymity)
- The master password is never stored; only its hash is saved

## Technical Details

### Backend
- FastAPI for RESTful API development
- Python cryptography library for secure encryption
- Password analysis and security algorithms

### Frontend
- Next.js React framework
- Material UI component library
- TypeScript for type safety
- Axios for API communication

## Future Improvements

- Browser extension for auto-filling credentials
- Mobile application
- Enhanced encryption for stored data
- Offline mode for breach checking
- Password expiration reminders
- Export/import capabilities
- Multi-user support with shared credentials
- Network security scanning

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational purposes and personal use. While it implements security best practices, no password manager can guarantee complete security. Always maintain backups of your important credentials.