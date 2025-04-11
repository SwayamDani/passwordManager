import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.config import settings

def send_email(to_email: str, subject: str, content: str) -> bool:
    """
    Send email using the configured SMTP server
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        content: Email content (HTML format)
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Create message
        message = MIMEMultipart()
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject

        # Add body to email
        message.attach(MIMEText(content, "html"))
        
        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            # Start TLS for security
            server.starttls()
            
            # Login to account - use FROM_EMAIL for username with Gmail
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            
            # Send email
            server.send_message(message)
            
        logging.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
        # Don't raise exception to prevent leaking information
        return False

def send_password_reset_email(email: str, token: str) -> bool:
    """
    Send password reset email with a token
    
    Args:
        email: Recipient email address
        token: Password reset token
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Construct reset email with proper frontend URL
    reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?token={token}"
    
    # Create HTML email content
    email_content = f"""
    <html>
    <body>
        <h2>Password Reset</h2>
        <p>Hello,</p>
        <p>Please use the following link to reset your password:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Regards,<br>Password Manager Team</p>
    </body>
    </html>
    """
    
    # Send the email
    return send_email(email, "Password Reset Request", email_content)