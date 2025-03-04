# Password Security Assessment Tool

A comprehensive cybersecurity application that helps users manage and assess the security of their passwords and online accounts. This full-stack solution provides powerful password management features with a focus on security analysis and improvement.

## Features

### Password Management
- **Secure Credential Storage**: All sensitive data is encrypted (SHA-256 hashing for passwords)
- **Account Organization**: Store and manage website credentials in one secure location
- **Password Generation**: Create strong, unique passwords with customizable parameters
- **2FA Tracking**: Keep track of which accounts have two-factor authentication enabled

### Security Analysis
- **Advanced Strength Evaluation**: Measure password security based on length, complexity, and character diversity
- **Data Breach Checking**: Integration with Have I Been Pwned using k-anonymity
- **Password Reuse Detection**: Identifies when the same password is used across multiple accounts
- **Password Aging**: Monitors how long passwords have been in use and suggests rotation
- **Security Score**: Visual metrics showing the overall security of your password collection

### Security Dashboard
- **Visual Security Indicators**: Color-coded security status for quick assessment
- **Security Insights**: Personalized recommendations to improve your security posture
- **Password Age Tracking**: Alerts for passwords that need rotation
- **Vulnerability Highlights**: Quick identification of your most vulnerable accounts

### User Interface
- **Modern Web Dashboard**: Intuitive UI to manage all your accounts and passwords
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Adapts to your system preferences

## Architecture

This project implements a full-stack architecture:

- **Backend**: Python FastAPI REST service with secure password handling
- **Frontend**: Next.js React application with Material UI components
- **Database**: File-based encrypted storage system
- **Authentication**: JWT-based authentication system

## Security Information

- All passwords are stored as SHA-256 hashes, not in plain text
- User data files are encrypted
- When checking for breaches, only the first 5 characters of the password hash are sent to the API (k-anonymity)
- The master password is never stored; only its hash is saved
- Rate limiting is implemented to prevent brute force attacks

## Installation

### Prerequisites
- Python 3.9+
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
5. Monitor the security status of all your accounts through the dashboard

## Technical Details

### Backend
- FastAPI for RESTful API development
- Python cryptography library for secure encryption
- Custom password analysis and security algorithms
- JWT-based authentication

### Frontend
- Next.js React framework
- Material UI component library
- TypeScript for type safety
- Axios for API communication
- Context API for state management

## Future Improvements

- Browser extension for auto-filling credentials
- Mobile application with biometric authentication
- Enhanced encryption for stored data
- Offline mode for breach checking
- Password expiration reminders
- Export/import capabilities
- Multi-user support with shared credentials
- Password categories and tagging
- Search and filtering functionality
- Password history tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational purposes and personal use. While it implements security best practices, no password manager can guarantee complete security. Always maintain backups of your important credentials.
