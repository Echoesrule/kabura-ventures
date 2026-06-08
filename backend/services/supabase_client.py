"""
Supabase Auth client service.
Handles token verification, user creation, and session management
using the Supabase admin (service_role) client.
"""

import os
from typing import Optional

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


def create_supabase_user(email: str, password: str, name: str = '', email_confirm: bool = True) -> Optional[dict]:
    """Create a user in Supabase Auth (admin API). Returns user dict or None."""
    client = get_admin_client()
    if not client:
        return None

    try:
        response = client.auth.admin.create_user({
            'email': email,
            'password': password,
            'email_confirm': email_confirm,
            'user_metadata': {'name': name} if name else {},
        })
        if response and response.user:
            return {
                'id': response.user.id,
                'email': getattr(response.user, 'email', ''),
            }
    except Exception as e:
        print(f"[supabase_client] Failed to create Supabase user: {e}")

    return None


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


def send_otp_email(email: str) -> tuple:
    """Send a 6-digit OTP verification code to the given email via Supabase.
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
        return True, None
    except Exception as e:
        err_msg = str(e)
        print(f"[supabase_client] Failed to send OTP email: {err_msg}")
        return False, err_msg


def verify_otp_code(email: str, token: str) -> tuple:
    """Verify a 6-digit OTP code for the given email via Supabase.
    Returns (success: bool, error_msg: str | None)."""
    client = get_anon_client()
    if not client:
        return False, "Supabase client not available (check env vars)"
    try:
        client.auth.verify_otp({
            'email': email,
            'token': token,
            'type': 'email',
        })
        return True, None
    except Exception as e:
        err_msg = str(e)
        print(f"[supabase_client] OTP verification failed: {err_msg}")
        return False, err_msg


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
