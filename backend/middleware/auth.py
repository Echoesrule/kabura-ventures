from functools import wraps
from datetime import datetime, timedelta
import jwt
from flask import request, jsonify, current_app
from models.user import User

def generate_token(user_id, role):
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(seconds=current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 86400)),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Authentication token is required'}), 401

        try:
            data = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401

        current_user = {
            'user_id': user.id,
            'role': user.role,
        }

        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated
