import os
import secrets
from dotenv import load_dotenv
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

load_dotenv()

def _require_or_generate(env_key: str, default_hint: str) -> str:
    """Return the env value, or generate a random value if unset.

    A generated value is never a publicly-known secret, so a missing env var
    cannot be exploited to forge tokens. It is only stable for the lifetime of
    the process, so production must set the env var explicitly.
    """
    value = os.environ.get(env_key)
    if value:
        return value
    print(f"WARNING: {env_key} not set. Generated an ephemeral random value. "
          f"Set it in production to avoid invalidating tokens on restart.")
    return secrets.token_hex(32)


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
    SECRET_KEY = _require_or_generate('SECRET_KEY', 'flask session secret')
    JWT_SECRET_KEY = _require_or_generate('JWT_SECRET_KEY', 'jwt signing secret')

    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

    JWT_ISSUER = os.environ.get('JWT_ISSUER', 'kabura-adventures-api')
    JWT_AUDIENCE = os.environ.get('JWT_AUDIENCE', 'kabura-adventures-web')

    TRUSTED_ORIGINS = [o.strip() for o in os.environ.get('TRUSTED_ORIGINS', '').split(',') if o.strip()]

    # Only trust X-Forwarded-For/X-Forwarded-Proto when the app sits behind a
    # trusted proxy that overwrites these headers (e.g. nginx, Render). When
    # disabled, the real socket address is used for rate limiting and security
    # headers, which cannot be spoofed by clients.
    TRUST_PROXY_HEADERS = os.environ.get('TRUST_PROXY_HEADERS', 'false').lower() in ('1', 'true', 'yes', 'on')

    SQLALCHEMY_DATABASE_URI = _build_database_uri(os.environ.get('DATABASE_URL'))

    # `sslmode` is a Postgres-only connect arg; only pass it when the target
    # database is Postgres so local SQLite development keeps working.
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_pre_ping': True, 'pool_recycle': 300}
    if (SQLALCHEMY_DATABASE_URI or '').startswith('postgres'):
        SQLALCHEMY_ENGINE_OPTIONS['connect_args'] = {
            'sslmode': os.environ.get('DATABASE_SSL_MODE', 'require')
        }

    RATE_LIMITING_ENABLED = True
    
    RATE_LIMITS = {
        'register': (5, 900),
        'login': (10, 300),
        'messages': (10, 60),
        'subscribers': (5, 60),
        'reviews': (5, 60),
        'bookings': (3, 60),
        'flight_requests': (5, 60),
    }


    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'assets', 'images')
    STORAGE_PROVIDER = os.environ.get('STORAGE_PROVIDER', 'local')
    BACKEND_URL = os.environ.get('BACKEND_URL')
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
    SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
    SUPABASE_STORAGE_BUCKET = os.environ.get('SUPABASE_STORAGE_BUCKET', 'kabura')

    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
