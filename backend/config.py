import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'kabura-adventures-secret-key-change-in-production')
   
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'kabura-jwt-secret-change-in-production')

    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

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
    SUPABASE_STORAGE_BUCKET = os.environ.get('SUPABASE_STORAGE_BUCKET', 'public')

    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
