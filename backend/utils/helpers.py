import re
import html
from functools import wraps
from datetime import datetime, timedelta
import jwt
from flask import request, jsonify, current_app
from werkzeug.utils import secure_filename
from PIL import Image


def validate_email(email):
    if len(email) > 255:
        return False
    pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    return re.match(pattern, email) is not None

def validate_required_fields(data, fields):
    missing = [f for f in fields if f not in data or data[f] == '' or data[f] is None]
    return missing

def sanitize_input(value, max_length=None):
    if not isinstance(value, str):
        return value
    value = value.strip()
    value = re.sub(r'<[^>]*>', '', value)
    value = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', value)
    value = re.sub(r' +', ' ', value)
    value = re.sub(r'\n{3,}', '\n\n', value)
    if max_length and len(value) > max_length:
        value = value[:max_length]
    return value

def validate_length(value, max_length, field_name):
    if isinstance(value, str) and len(value) > max_length:
        return f'{field_name} exceeds maximum length of {max_length} characters'
    return None

def validate_number(value, min_val=None, max_val=None, field_name='Value'):
    try:
        num = float(value)
    except (TypeError, ValueError):
        return f'{field_name} must be a valid number'
    if min_val is not None and num < min_val:
        return f'{field_name} must be at least {min_val}'
    if max_val is not None and num > max_val:
        return f'{field_name} must be at most {max_val}'
    return None

def sanitize_filename(filename):
    if not isinstance(filename, str):
        return ''
    filename = secure_filename(filename)
    filename = re.sub(r'[^\w\.\-]', '_', filename)
    return filename

def validate_date_format(date_str):
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except (ValueError, TypeError):
        return False

def allowed_file(file_or_name):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ALLOWED_MIME_TYPES = {'image/png', 'image/jpeg', 'image/gif', 'image/webp'}

    if hasattr(file_or_name, 'content_type'):
        return file_or_name.content_type in ALLOWED_MIME_TYPES

    if isinstance(file_or_name, str):
        ext = file_or_name.rsplit('.', 1)[1].lower() if '.' in file_or_name else ''
        return ext in ALLOWED_EXTENSIONS

    return False

def paginate(query, page, per_page):
    page = max(1, page)
    per_page = min(max(1, per_page), 100)
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        'items': items,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }
def validate_phone_number(phone):
    pattern = r'^\+?[1-9]\d{1,14}$'
    return re.match(pattern, phone) is not None
