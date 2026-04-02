import os
import resend
from typing import Optional

# Initialize Resend
resend.api_key = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "FairShare <onboarding@resend.dev>")

def send_invite_email(to_email: str, group_name: str, invited_by_name: Optional[str] = None):
    """
    Sends an invitation email to a new user using Resend.
    """
    if not resend.api_key:
        print(f"DEBUG: No RESEND_API_KEY found. Skipping email to {to_email}")
        print(f"INVITATION: {invited_by_name or 'Someone'} invited you to join '{group_name}' on FairShare!")
        return

    subject = f"You've been invited to {group_name} on FairShare"
    
    inviter_text = f"{invited_by_name} has" if invited_by_name else "You have been"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
        <h1 style="color: #111827; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; margin-bottom: 16px;">FairShare</h1>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Hello! {inviter_text} invited you to join the group <strong>{group_name}</strong> on FairShare.
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
            FairShare makes it easy to split bills, track debts, and settle up with friends.
        </p>
        <a href="https://fair-share.online/dashboard" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em;">Join the Group</a>
        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #e5e7eb;" />
        <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
            If you didn't expect this invitation, you can safely ignore this email.
        </p>
    </div>
    """

    try:
        params = {
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        
        email = resend.Emails.send(params)
        print(f"DEBUG: Sent invite email to {to_email} via Resend. ID: {email['id']}")
        return email
    except Exception as e:
        print(f"ERROR: Failed to send invite email via Resend: {e}")
        return None
