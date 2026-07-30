import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def _get_smtp_config():
    return {
        'server': os.environ.get('SMTP_SERVER', ''),
        'port': int(os.environ.get('SMTP_PORT', '587')),
        'username': os.environ.get('SMTP_USERNAME', ''),
        'password': os.environ.get('SMTP_PASSWORD', ''),
        'from_addr': os.environ.get('SMTP_FROM', os.environ.get('SMTP_USERNAME', 'noreply@kaburaadventures.com')),
        'use_tls': os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true',
    }


def is_smtp_configured():
    cfg = _get_smtp_config()
    return bool(cfg['server'] and cfg['username'] and cfg['password'])


def send_email(to_email: str, subject: str, html_body: str, text_body: str = '') -> tuple:
    if not is_smtp_configured():
        return False, "SMTP not configured"

    cfg = _get_smtp_config()
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = cfg['from_addr']
    msg['To'] = to_email

    if text_body:
        msg.attach(MIMEText(text_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))

    try:
        if cfg['use_tls']:
            server = smtplib.SMTP(cfg['server'], cfg['port'])
            server.ehlo()
            server.starttls()
            server.ehlo()
        else:
            server = smtplib.SMTP(cfg['server'], cfg['port'])

        if cfg['username'] and cfg['password']:
            server.login(cfg['username'], cfg['password'])

        server.sendmail(cfg['from_addr'], [to_email], msg.as_string())
        server.quit()
        logger.info(f"Email sent to {to_email}: {subject}")
        return True, None
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False, str(e)


def send_otp_email_smtp(to_email: str, otp_code: str) -> tuple:
    subject = "Your Kabura Adventures Verification Code"
    text_body = f"""Hello,

Your verification code for Kabura Adventures is:

   {otp_code}

This code expires in 10 minutes.

If you did not create an account, please ignore this email.

Best regards,
Kabura Adventures Team
"""
    html_body = f"""<html><body style="font-family:Arial,sans-serif;padding:20px;">
<h2>Kabura Adventures</h2>
<p>Your verification code is:</p>
<div style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;
     padding:20px;background:rgba(138,168,153,0.06);border-radius:8px;margin:20px 0;">
{otp_code}</div>
<p>This code expires in <strong>10 minutes</strong>.</p>
<p>If you did not create an account, please ignore this email.</p>
<hr><small>Kabura Adventures &mdash; Kenya's Premier Tour Experience</small>
</body></html>"""
    return send_email(to_email, subject, html_body, text_body)
