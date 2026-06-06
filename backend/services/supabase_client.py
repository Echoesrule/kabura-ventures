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


def create_supabase_user(email: str, password: str, name: str = '') -> Optional[dict]:
    """Create a user in Supabase Auth (admin API). Returns user dict or None."""
    client = get_admin_client()
    if not client:
        return None

    try:
        response = client.auth.admin.create_user({
            'email': email,
            'password': password,
            'email_confirm': True,
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
