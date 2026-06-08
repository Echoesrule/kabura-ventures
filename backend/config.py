import os
from dotenv import load_dotenv
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

load_dotenv()


def _build_database_uri(uri: str | None) -> str | None: 
    
    if not uri:
        return uri
    lowered = uri.lower()
    if 'supabase' in lowered and 'sslmode' not in lowered:
        parsed = urlparse(uri)
        query = dict(parse_qsl(parsed.query))
        query.setdefault('sslmode', 'require')
        parsed = parsed._replace(query=urlencode(query))
        return urlunparse(parsed)
    return uri

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'kabura-adventures-secret-key-change-in-production')
   
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'kabura-jwt-secret-change-in-production')

    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

    SQLALCHEMY_DATABASE_URI = _build_database_uri(os.environ.get('DATABASE_URL'))
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'sslmode': os.environ.get('DATABASE_SSL_MODE', 'require')}
    } if os.environ.get('DATABASE_SSL_MODE') else {}

    RATE_LIMITING_ENABLED = True
    
    RATE_LIMITS = {
        'register': (5, 900),
        'login': (10, 300),
        'messages': (10, 60),
    }


    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'assets', 'images')
    STORAGE_PROVIDER = os.environ.get('STORAGE_PROVIDER', 'local')
    BACKEND_URL = os.environ.get('BACKEND_URL')
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
    SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
    SUPABASE_STORAGE_BUCKET = os.environ.get('SUPABASE_STORAGE_BUCKET', 'kabura')

    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
