"""
Supabase Auth API routes.
Provides endpoints for frontend to exchange Supabase sessions for Flask JWTs,
and to retrieve public Supabase configuration.
"""

import os
import secrets
from flask import Blueprint, request, jsonify
from models.user import User
from models import db
from middleware.auth import generate_token
from services.supabase_client import verify_supabase_token

supabase_auth_bp = Blueprint('supabase_auth', __name__, url_prefix='/api/auth/supabase')


@supabase_auth_bp.route('/config', methods=['GET'])
def get_supabase_config():
    """Return public Supabase configuration for the frontend client."""
    supabase_url = os.environ.get('SUPABASE_URL', '')
    supabase_anon_key = os.environ.get('SUPABASE_ANON_KEY', '')
    if not supabase_url or not supabase_anon_key:
        return jsonify({'error': 'Supabase not configured'}), 500
    return jsonify({
        'url': supabase_url,
        'anonKey': supabase_anon_key,
    })


@supabase_auth_bp.route('/exchange', methods=['POST'])
def exchange_supabase_session():
    """Exchange a Supabase access token for a Flask JWT.
    Expects: { access_token: string }
    Verifies the token with Supabase, finds or creates a local user,
    and returns a Flask JWT + user object.
    """
    data = request.get_json()
    if not data or 'access_token' not in data:
        return jsonify({'error': 'access_token is required'}), 400

    access_token = data['access_token'].strip()

    # Verify token with Supabase
    supabase_user = verify_supabase_token(access_token)
    if not supabase_user:
        return jsonify({'error': 'Invalid or expired Supabase token'}), 401

    email = supabase_user.get('email', '')
    if not email:
        return jsonify({'error': 'Supabase user has no email'}), 400

    name = supabase_user.get('name', email.split('@')[0])

    # Find or create local user
    user = User.query.filter_by(email=email).first()
    if not user:
        # Create a local user account with a random password
        # (OAuth users authenticate via Supabase, not local password)
        random_pw = secrets.token_urlsafe(32)
        user = User(
            name=name,
            email=email,
            password='',  # placeholder, overwritten below
            role='customer',
        )
        user.set_password(random_pw)
        db.session.add(user)
        db.session.commit()
    else:
        # Update name if the Supabase profile has a more complete name
        if supabase_user.get('name') and supabase_user['name'] != email.split('@')[0]:
            user.name = supabase_user['name']
            db.session.commit()

    # Generate Flask JWT (same format as existing auth)
    token = generate_token(user.id, user.role)

    return jsonify({
        'message': 'Supabase authentication successful',
        'token': token,
        'user': user.to_dict(),
    }), 200
