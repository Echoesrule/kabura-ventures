import os
from flask import Flask, send_from_directory, jsonify, request
import psycopg2
from dotenv import load_dotenv
from flask_cors import CORS
from config import Config
from models import db, bcrypt
from routes.auth import auth_bp
from routes.tours import tours_bp
from routes.bookings import bookings_bp
from routes.flights import flights_bp
from routes.hotels import hotels_bp
from routes.payments import payments_bp
from routes.messages import messages_bp
from routes.media import media_bp
from routes.reviews import reviews_bp
from routes.subscribers import subscribers_bp
from routes.wishlist import wishlist_bp
from routes.availability import availability_bp
from routes.currencies import currencies_bp
from routes.blogs import blogs_bp
from routes.search import search_bp
from routes.company import company_bp
from routes.analytics import analytics_bp
from routes.supabase_auth import supabase_auth_bp
from middleware.auth import admin_required
from services.seed import seed_database

load_dotenv()


def create_app():
    app = Flask(__name__, static_folder='../frontend', static_url_path='')
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)
    bcrypt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(tours_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(flights_bp)
    app.register_blueprint(hotels_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(media_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(subscribers_bp)
    app.register_blueprint(wishlist_bp)
    app.register_blueprint(availability_bp)
    app.register_blueprint(currencies_bp)
    app.register_blueprint(blogs_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(company_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(supabase_auth_bp)

    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/admin')
    @admin_required
    def admin_dashboard(current_user):
        return send_from_directory(app.static_folder, 'admin.html')

    @app.route('/<path:path>')
    def serve_static(path):
        if path.startswith('assets/'):
            return send_from_directory(app.static_folder, path)
        if path.endswith('admin.html'):
            return jsonify({'error': 'Not found'}), 404
        try:
            return send_from_directory(app.static_folder, path)
        except:
            return send_from_directory(app.static_folder, 'index.html')

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy', 'message': 'Kabura Adventures API is running'})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    with app.app_context():
        try:
            db.create_all()
            # migrate: add caption column to hero_images if missing
            try:
                db.session.execute(db.text('ALTER TABLE hero_images ADD COLUMN IF NOT EXISTS caption VARCHAR(255)'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add is_verified column to users if missing
            try:
                db.session.execute(db.text('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN'))
                db.session.execute(db.text('UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL'))
                db.session.execute(db.text('ALTER TABLE users ALTER COLUMN is_verified SET DEFAULT FALSE'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add OTP columns to users if missing
            try:
                db.session.execute(db.text('ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code_hash VARCHAR(128)'))
                db.session.execute(db.text('ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP'))
                db.session.execute(db.text('ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            seed_database()
        except Exception as e:
            print(f"Warning: Could not initialize database: {e}")
            print("App will run without database tables. Ensure Supabase connection works before use.")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
