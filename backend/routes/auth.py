import logging
from flask import Blueprint, request, jsonify
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
from services.email_service import send_otp_email_smtp, is_smtp_configured

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

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

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
    logger.info(f"OTP for {email}: {otp_code}")

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
    logger.info(f"Resent OTP for {email}: {otp_code}")

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
    # debug: log incoming payload for troubleshooting client mismatch
    try:
        raw = request.get_data(as_text=True)
    except Exception:
        raw = '<unreadable>'
    request_app = request
    try:
        from flask import current_app
        current_app.logger.debug(f"[/api/auth/login] raw_request_data: {raw}")
        current_app.logger.debug(f"[/api/auth/login] content_type: {request.content_type}")
        current_app.logger.debug(f"[/api/auth/login] headers: {dict(request.headers)}")
    except Exception:
        pass

    data = request.get_json(silent=True)
    if not data:
        # try form-encoded fallback (e.g., browser form submit)
        form_data = request.form.to_dict() if request.form else None
        if form_data:
            try:
                from flask import current_app
                current_app.logger.debug(f"[/api/auth/login] parsed form_data: {form_data}")
            except Exception:
                pass
            data = form_data
        else:
            return jsonify({'error': 'No data provided', 'raw': raw}), 400

    # accept either 'email' or 'identifier' (username/name) for login
    if not data.get('password') or not (data.get('email') or data.get('identifier')):
        return jsonify({'error': 'Missing fields: email/identifier, password'}), 400

    identifier = sanitize_input(data.get('identifier') or data.get('email') or '').lower()
    password = data['password']

    # try to find by email first, then by name
    user = User.query.filter_by(email=identifier).first()
    if not user:
        user = User.query.filter_by(name=identifier).first()

    if not user or not user.check_password(password):
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
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200
