import logging
import os
from app.config import settings
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

def send_email(to_email: str, subject: str, content: str) -> bool:
    """
    Send email using Brevo API instead of SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        content: Email content (HTML format)
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Configure API key authorization
        api_key = os.getenv("BREVO_API_KEY", settings.BREVO_API_KEY)
        from_email = os.getenv("SMTP_FROM_EMAIL", settings.SMTP_FROM_EMAIL)
        sender_name = "Password Manager"
        
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = api_key
        
        # Create an instance of the TransactionalEmailsApi
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        # Create the sender
        sender = {"name": sender_name, "email": from_email}
        
        # Create the recipient
        to = [{"email": to_email}]
        
        # Create the email request
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=to,
            sender=sender,
            subject=subject,
            html_content=content
        )
        
        # Send the email
        logging.info(f"Sending email to {to_email} via Brevo API")
        api_response = api_instance.send_transac_email(send_smtp_email)
        logging.info(f"Email sent successfully to {to_email} with message ID: {api_response.message_id}")
        return True
    except ApiException as e:
        logging.error(f"API Exception when sending email: {e}")
        return False
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
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