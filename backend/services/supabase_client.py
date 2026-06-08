"""
Supabase Auth client service.
Handles token verification, user creation, OTP generation and session management.
"""

import os
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from supabase import create_client, Client
    _supabase_available = True
except ImportError:
    _supabase_available = False
    Client = None
    def create_client(*a, **kw):
        raise ImportError("supabase package not installed")

_supabase_admin = None
_supabase_anon = None


def get_admin_client():
    """Lazy-init and return the Supabase admin client using the service_role key."""
    global _supabase_admin
    if _supabase_admin is not None:
        return _supabase_admin

    if not _supabase_available:
        print("[supabase_client] supabase package not available")
        return None

    url = os.environ.get('SUPABASE_URL')
    service_key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not service_key:
        print("[supabase_client] SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
        return None

    try:
        _supabase_admin = create_client(url, service_key)
        return _supabase_admin
    except Exception as e:
        print(f"[supabase_client] Failed to create admin client: {e}")
        return None


def verify_supabase_token(access_token: str) -> Optional[dict]:
    """Verify a Supabase access_token and return the user dict, or None."""
    client = get_admin_client()
    if not client:
        return None

    try:
        response = client.auth.get_user(access_token)
        if response and response.user:
            return {
                'id': response.user.id,
                'email': getattr(response.user, 'email', ''),
                'name': (
                    (response.user.user_metadata or {}).get('name')
                    or (response.user.user_metadata or {}).get('full_name')
                    or (response.user.email or '').split('@')[0]
                ),
                'avatar_url': (response.user.user_metadata or {}).get('avatar_url', ''),
                'email_confirmed': getattr(response.user, 'email_confirmed_at', None) is not None,
            }
    except Exception as e:
        print(f"[supabase_client] Token verification failed: {e}")

    return None


def create_supabase_user(email: str, password: str, name: str = '', email_confirm: bool = True) -> tuple:
    """Create a user in Supabase Auth (admin API). Returns (user_dict, error_message).
    On success, error_message is None. On failure, user_dict is None and error_message contains the error.
    """
    client = get_admin_client()
    if not client:
        return (None, "Supabase client not available")

    try:
        response = client.auth.admin.create_user({
            'email': email,
            'password': password,
            'email_confirm': email_confirm,
            'user_metadata': {'name': name} if name else {},
        })
        if response and response.user:
            return ({
                'id': response.user.id,
                'email': getattr(response.user, 'email', ''),
            }, None)
    except Exception as e:
        err_msg = str(e)
        print(f"[supabase_client] Failed to create Supabase user: {err_msg}")
        return (None, err_msg)

    return (None, "Unknown error creating Supabase user")


def get_anon_client():
    """Lazy-init and return a regular (non-admin) Supabase client using the anon key."""
    global _supabase_anon
    if _supabase_anon is not None:
        return _supabase_anon

    if not _supabase_available:
        print("[supabase_client] supabase package not available")
        return None
    url = os.environ.get('SUPABASE_URL')
    anon_key = os.environ.get('SUPABASE_ANON_KEY')
    if not url or not anon_key:
        print("[supabase_client] SUPABASE_URL or SUPABASE_ANON_KEY not set")
        return None
    try:
        _supabase_anon = create_client(url, anon_key)
        return _supabase_anon
    except Exception as e:
        print(f"[supabase_client] Failed to create anon client: {e}")
        return None


def _hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure random numeric OTP."""
    return str(secrets.randbelow(10 ** length)).zfill(length)


def store_otp_for_user(user: 'User') -> str:
    """Generate a 6-digit OTP, hash it, store on the user record, and return the raw code."""
    code = generate_otp()
    user.otp_code_hash = _hash_otp(code)
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    user.otp_attempts = 0
    return code


def verify_stored_otp(user: 'User', code: str) -> bool:
    """Verify a code against the user's stored (hashed) OTP. Checks expiry and increments attempts."""
    if not user.otp_code_hash or not user.otp_expiry:
        return False
    if datetime.utcnow() > user.otp_expiry:
        return False
    if user.otp_attempts is not None and user.otp_attempts >= 5:
        return False
    user.otp_attempts = (user.otp_attempts or 0) + 1
    if _hash_otp(code) == user.otp_code_hash:
        user.otp_code_hash = None
        user.otp_expiry = None
        user.otp_attempts = 0
        return True
    return False


def confirm_supabase_email(email: str) -> bool:
    """Mark a user's email as confirmed in Supabase Auth via admin API."""
    client = get_admin_client()
    if not client:
        return False
    try:
        response = client.auth.admin.list_users()
        for u in (getattr(response, 'users', None) or []):
            if getattr(u, 'email', '') == email:
                client.auth.admin.update_user_by_id(u.id, {'email_confirm': True})
                logger.info(f"Confirmed email in Supabase for {email}")
                return True
        logger.warning(f"User {email} not found in Supabase Auth for email confirmation")
        return False
    except Exception as e:
        logger.error(f"Failed to confirm email in Supabase: {e}")
        return False


def send_otp_email(email: str) -> tuple:
    """Send a magic-link email via Supabase Auth.
    The email contains a magic link (clickable).
    For the 6-digit OTP code, use generate_otp() + store_otp_for_user() instead.
    Returns (success: bool, error_msg: str | None)."""
    client = get_anon_client()
    if not client:
        return False, "Supabase client not available (check env vars)"
    try:
        site_url = os.environ.get('SITE_URL', 'https://kabura-adventures.onrender.com')
        client.auth.sign_in_with_otp({
            'email': email,
            'options': {
                'should_create_user': True,
                'email_redirect_to': f'{site_url}/login.html',
            },
        })
        logger.info(f"Supabase magic-link email sent to {email}")
        return True, None
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Failed to send magic-link email via Supabase: {err_msg}")
        return False, err_msg


def verify_otp_code(email: str, token: str) -> tuple:
    """Verify a 6-digit OTP code via Supabase.
    Returns (success: bool, error_msg: str | None)."""
    client = get_anon_client()
    if not client:
        return False, "Verification service not available"
    try:
        client.auth.verify_otp({
            'email': email,
            'token': token,
            'type': 'email',
        })
        return True, None
    except Exception as e:
        err_msg = str(e)
        logger.warning(f"Supabase OTP verification failed for {email}: {err_msg}")
        return False, "Invalid or expired verification code"


def update_supabase_password(access_token: str, new_password: str) -> bool:
    """Update password for a Supabase user using their access token."""
    client = get_admin_client()
    if not client:
        return False

    try:
        # Verify token first to get the user
        user_info = verify_supabase_token(access_token)
        if not user_info:
            return False

        # Admin API to update user password
        client.auth.admin.update_user_by_id(user_info['id'], {
            'password': new_password,
        })
        return True
    except Exception as e:
        print(f"[supabase_client] Password update failed: {e}")

    return False
