import os
import logging
import re
from flask import Blueprint, request, jsonify, current_app
from models.user import User
from models.message import Notification
from models import db
from middleware.auth import generate_token, token_required
from middleware.rate_limit import rate_limit
from utils.helpers import validate_email, validate_required_fields, sanitize_input, validate_length
from services.supabase_client import (
    send_otp_email, verify_otp_code, create_supabase_user,
    store_otp_for_user, verify_stored_otp, confirm_supabase_email,
)
from services.email_service import send_otp_email_smtp, is_smtp_configured, send_email
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
@rate_limit(config_key='register', key_prefix='register')
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['name', 'email', 'password'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    name = sanitize_input(data['name'], max_length=255)
    email = sanitize_input(data['email'], max_length=255).lower()
    password = data['password']

    errors = []
    name_err = validate_length(name, 255, 'Name')
    if name_err: errors.append(name_err)
    email_err = validate_length(email, 255, 'Email')
    if email_err: errors.append(email_err)
    if errors:
        return jsonify({'error': '. '.join(errors)}), 400

    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    if not re.search(r'[A-Z]', password):
        return jsonify({'error': 'Password must contain an uppercase letter'}), 400
    if not re.search(r'[a-z]', password):
        return jsonify({'error': 'Password must contain a lowercase letter'}), 400
    if not re.search(r'[0-9]', password):
        return jsonify({'error': 'Password must contain a number'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    phone = sanitize_input(data.get('phone', ''), max_length=50)
    user = User(name=name, email=email, phone=phone, is_verified=False)
    user.set_password(password)

    db.session.add(user)
    db.session.flush()

    supabase_user, supabase_error = create_supabase_user(email, password, name=name, email_confirm=False)
    if not supabase_user:
        if supabase_error and 'already been registered' in supabase_error.lower():
            pass
        else:
            db.session.rollback()
            return jsonify({'error': f'Failed to create authentication account: {supabase_error or "Please try again."}'}), 500

    otp_code = store_otp_for_user(user)
    logger.debug(f"OTP sent to {email}")

    email_sent = False
    last_error = None

    if is_smtp_configured():
        email_sent, last_error = send_otp_email_smtp(email, otp_code)

    if not email_sent:
        supabase_sent, supabase_err = send_otp_email(email)
        if supabase_sent:
            email_sent = True
        else:
            last_error = supabase_err

    db.session.commit()

    if not email_sent:
        logger.error(f"Failed to send OTP email to {email}: {last_error}")
        return jsonify({
            'error': 'Account created but verification email could not be sent. Use "Resend Code" to try again.',
            'email': email,
            'requires_verification': True,
            'otp_retry': True
        }), 201

    return jsonify({
        'message': 'Registration successful. Please check your email for the verification code.',
        'email': email,
        'requires_verification': True
    }), 201

@auth_bp.route('/send-otp', methods=['POST'])
@rate_limit(config_key='register', key_prefix='send_otp')
def send_otp():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400

    email = sanitize_input(data['email'], max_length=255).lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.is_verified:
        return jsonify({'error': 'Email already verified'}), 400

    otp_code = store_otp_for_user(user)
    logger.debug(f"OTP resent to {email}")

    email_sent = False
    last_error = None

    if is_smtp_configured():
        email_sent, last_error = send_otp_email_smtp(email, otp_code)

    if not email_sent:
        supabase_sent, supabase_err = send_otp_email(email)
        if supabase_sent:
            email_sent = True
        else:
            last_error = supabase_err

    if not email_sent:
        logger.error(f"Failed to resend OTP to {email}: {last_error}")
        return jsonify({'error': f'Failed to send verification email. Please try again later.'}), 500

    db.session.commit()

    return jsonify({'message': 'Verification code sent to your email.'}), 200

@auth_bp.route('/verify-email', methods=['POST'])
@rate_limit(config_key='register', key_prefix='verify_email')
def verify_email():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('token'):
        return jsonify({'error': 'Email and verification code are required'}), 400

    email = sanitize_input(data['email'], max_length=255).lower()
    token = data['token'].strip()

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.is_verified:
        token = generate_token(user.id, user.role)
        return jsonify({'message': 'Email already verified', 'token': token, 'user': user.to_dict()}), 200

    if not verify_stored_otp(user, token):
        valid, verify_error = verify_otp_code(email, token)
        if not valid:
            return jsonify({'error': verify_error or 'Invalid or expired verification code'}), 400

    user.is_verified = True
    db.session.commit()

    confirm_supabase_email(email)

    token = generate_token(user.id, user.role)

    return jsonify({
        'message': 'Email verified successfully',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/login', methods=['POST'])
@rate_limit(config_key='login', key_prefix='login')
def login():
    import traceback as tb
    try:
        try:
            raw = request.get_data(as_text=True)
        except Exception:
            raw = '<unreadable>'
        try:
            from flask import current_app
            current_app.logger.debug(f"[/api/auth/login] raw_request_data: {raw}")
            current_app.logger.debug(f"[/api/auth/login] content_type: {request.content_type}")
        except Exception:
            pass

        data = request.get_json(silent=True)
        if not data:
            form_data = request.form.to_dict() if request.form else None
            if form_data:
                data = form_data
            else:
                return jsonify({'error': 'No data provided', 'raw': raw}), 400

        if not data.get('password') or not (data.get('email') or data.get('identifier')):
            return jsonify({'error': 'Missing fields: email/identifier, password'}), 400

        identifier = sanitize_input(data.get('identifier') or data.get('email') or '').lower()
        password = data['password']

        user = User.query.filter_by(email=identifier).first()
        if not user:
            user = User.query.filter_by(name=identifier).first()

        if not user or not user.check_password(password):
            logger.warning(f"Failed login attempt for identifier: {identifier}")
            return jsonify({'error': 'Invalid credentials'}), 401

        if not user.is_verified:
            return jsonify({
                'error': 'Please verify your email before logging in',
                'email': user.email,
                'requires_verification': True
            }), 403

        token = generate_token(user.id, user.role)

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"Login error: {e}\n{tb.format_exc()}")
        return jsonify({'error': f'Login failed: {str(e)}', 'detail': tb.format_exc()}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
@rate_limit(config_key='forgot_password', key_prefix='forgot_password')
def forgot_password():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400

    email = sanitize_input(data['email'], max_length=255).lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'If that email is registered, a reset link has been sent.'}), 200

    serializer = URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])
    token = serializer.dumps(user.id, salt='password-reset')

    frontend_url = (
        os.environ.get('FRONTEND_URL')
        or request.headers.get('Origin')
        or request.url_root.rstrip('/')
    )
    reset_link = f"{frontend_url.rstrip('/')}/login?reset={token}"

    subject = "Reset Your Kabura Adventures Password"
    html_body = f"""<html><body style="font-family:Arial,sans-serif;padding:20px;">
<h2>Kabura Adventures</h2>
<p>Hello {sanitize_input(user.name, max_length=100)},</p>
<p>We received a request to reset your password. Click the button below to set a new one:</p>
<div style="text-align:center;margin:30px 0;">
  <a href="{reset_link}"
     style="background:#1a5632;color:#fff;padding:14px 32px;border-radius:6px;
            text-decoration:none;font-size:16px;display:inline-block;">
     Reset Password
  </a>
</div>
<p>This link expires in <strong>1 hour</strong>.</p>
<p>If you did not request a password reset, please ignore this email.</p>
<hr><small>Kabura Adventures &mdash; Kenya's Premier Tour Experience</small>
</body></html>"""
    text_body = f"""Hello {user.name},

We received a request to reset your password. Visit this link to set a new one:

{reset_link}

This link expires in 1 hour.

If you did not request a password reset, please ignore this email.

Best regards,
Kabura Adventures Team"""

    sent, err = send_email(email, subject, html_body, text_body)
    if not sent:
        logger.error(f"Failed to send password reset email to {email}: {err}")
        return jsonify({'error': 'Failed to send reset email. Please try again later.'}), 500

    return jsonify({'message': 'If that email is registered, a reset link has been sent.'}), 200


@auth_bp.route('/reset-password', methods=['POST'])
@rate_limit(config_key='reset_password', key_prefix='reset_password')
def reset_password():
    data = request.get_json()
    if not data or not data.get('token') or not data.get('password'):
        return jsonify({'error': 'Token and password are required'}), 400

    token = data['token'].strip()
    password = data['password']

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    if not re.search(r'[A-Z]', password):
        return jsonify({'error': 'Password must contain an uppercase letter'}), 400
    if not re.search(r'[a-z]', password):
        return jsonify({'error': 'Password must contain a lowercase letter'}), 400
    if not re.search(r'[0-9]', password):
        return jsonify({'error': 'Password must contain a number'}), 400

    serializer = URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])
    try:
        user_id = serializer.loads(token, salt='password-reset', max_age=3600)
    except SignatureExpired:
        return jsonify({'error': 'Reset link has expired. Please request a new one.'}), 400
    except BadSignature:
        return jsonify({'error': 'Invalid reset link.'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user.set_password(password)
    db.session.commit()

    return jsonify({'message': 'Password updated successfully. You can now log in.'}), 200


@auth_bp.route('/verification-status', methods=['GET'])
def verification_status():
    email = request.args.get('email', '').lower().strip()
    if not email or not validate_email(email):
        return jsonify({'error': 'Valid email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.is_verified:
        token = generate_token(user.id, user.role)
        return jsonify({'verified': True, 'token': token, 'user': user.to_dict()}), 200

    return jsonify({'verified': False}), 200

@auth_bp.route('/profile', methods=['GET'])
@token_required
def profile(current_user):
    user = User.query.get(current_user['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    user = User.query.get(current_user['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'name' in data:
        user.name = sanitize_input(data['name'], max_length=255)
    if 'phone' in data:
        user.phone = sanitize_input(data['phone'], max_length=50)
    if 'password' in data and data['password']:
        if len(data['password']) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        if not re.search(r'[A-Z]', data['password']):
            return jsonify({'error': 'Password must contain an uppercase letter'}), 400
        if not re.search(r'[a-z]', data['password']):
            return jsonify({'error': 'Password must contain a lowercase letter'}), 400
        if not re.search(r'[0-9]', data['password']):
            return jsonify({'error': 'Password must contain a number'}), 400
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200
