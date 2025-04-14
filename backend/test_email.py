import logging
import sys
from app.utils.email import send_password_reset_email
from app.config import settings

# Configure logging to output to console
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

if __name__ == "__main__":
    test_email = "swayamashishdani@gmail.com"  # Your email address
    test_token = "test_token_123456"
    
    print("Testing email with Brevo SMTP relay configuration:")
    print(f"SMTP_SERVER: {settings.SMTP_SERVER}")
    print(f"SMTP_PORT: {settings.SMTP_PORT}")
    print(f"SMTP_USERNAME: {settings.SMTP_USERNAME}")
    print(f"SMTP_FROM_EMAIL: {settings.SMTP_FROM_EMAIL}")
    print(f"SMTP_PASSWORD length: {len(settings.SMTP_PASSWORD)} chars")
    
    success = send_password_reset_email(test_email, test_token)
    if success:
        print("Test email was sent successfully! Check your inbox and spam folder.")
    else:
        print("Failed to send test email.")
        print("Make sure you've set the following environment variables in your .env.local file:")
        print("SMTP_USERNAME - Your Brevo account email")
        print("SMTP_PASSWORD - Your Brevo API key/password")
        print("SMTP_FROM_EMAIL - The sender email address (passwordmanager@swayamdani.com)")