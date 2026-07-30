import os
from flask import Flask, render_template, send_from_directory, jsonify, request, redirect, abort
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
from routes.destinations import destinations_bp
from routes.offers import offers_bp
from routes.testimonials import testimonials_bp
from routes.page_content import page_content_bp
from routes.users import users_bp
from services.seed import seed_database

load_dotenv()


def page(name):
    return render_template(name + '.html')


def create_app():
    app = Flask(__name__, static_folder='../frontend', template_folder='../frontend', static_url_path='')
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
    app.register_blueprint(destinations_bp)
    app.register_blueprint(offers_bp)
    app.register_blueprint(testimonials_bp)
    app.register_blueprint(page_content_bp)
    app.register_blueprint(users_bp)

    # ── Page routes ────────────────────────────────────────────
    app.add_url_rule('/', 'home', lambda: page('index'))
    app.add_url_rule('/about', 'about', lambda: page('about'))
    app.add_url_rule('/login', 'login', lambda: page('login'))
    app.add_url_rule('/signup', 'signup', lambda: page('signup'))
    app.add_url_rule('/tours', 'tours', lambda: page('tours'))
    app.add_url_rule('/tour-detail', 'tour_detail_old', lambda: page('tour-detail'))
    app.add_url_rule('/hotels', 'hotels', lambda: page('hotels'))
    app.add_url_rule('/hotel-detail', 'hotel_detail_old', lambda: page('hotel-detail'))

    @app.route('/tours/<slug>')
    def tour_detail(slug):
        return render_template('tour-detail.html', slug=slug)

    @app.route('/hotels/<slug>')
    def hotel_detail(slug):
        return render_template('hotel-detail.html', slug=slug)
    app.add_url_rule('/booking', 'booking', lambda: page('booking'))
    app.add_url_rule('/destinations', 'destinations', lambda: page('destinations'))
    app.add_url_rule('/flights', 'flights', lambda: page('flights'))
    app.add_url_rule('/blog', 'blog', lambda: page('blog'))
    app.add_url_rule('/blog-detail', 'blog_detail', lambda: page('blog-detail'))
    app.add_url_rule('/contact', 'contact', lambda: page('contact'))
    app.add_url_rule('/help', 'help', lambda: page('help'))
    app.add_url_rule('/wishlist', 'wishlist', lambda: page('wishlist'))
    app.add_url_rule('/safari', 'safari', lambda: page('safari'))
    app.add_url_rule('/beach', 'beach', lambda: page('beach'))
    app.add_url_rule('/cultural', 'cultural', lambda: page('cultural'))
    app.add_url_rule('/trekking', 'trekking', lambda: page('trekking'))
    app.add_url_rule('/honeymoon', 'honeymoon', lambda: page('honeymoon'))
    app.add_url_rule('/group', 'group', lambda: page('group'))
    app.add_url_rule('/services', 'services', lambda: page('services'))
    app.add_url_rule('/maps', 'maps', lambda: page('maps'))

    @app.route('/admin')
    def admin_dashboard():
        return send_from_directory(os.path.join(app.root_path, 'templates'), 'admin.html')

    KNOWN_PAGES = {'about', 'login', 'signup', 'tours', 'hotels',
                    'tour-detail', 'hotel-detail',
                    'booking', 'destinations', 'flights', 'blog',
                    'blog-detail', 'contact', 'help', 'wishlist', 'safari', 'beach',
                    'cultural', 'trekking', 'honeymoon', 'group', 'services', 'maps'}

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy', 'message': 'Kabura Adventures API is running'})

    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Resource not found'}), 404
        return render_template('404.html'), 404

    @app.route('/<path:path>')
    def serve_static(path):
        # API paths with no matching blueprint route → proper 404
        if path.startswith('api/'):
            abort(404)
        if path.startswith('assets/'):
            return send_from_directory(app.static_folder, path)
        # Redirect old .html page URLs to clean URLs (preserving query string)
        if path.endswith('.html'):
            base = path[:-5]
            if base in KNOWN_PAGES:
                dest = '/' + base
                qs = request.query_string.decode() if request.query_string else ''
                if qs:
                    dest += '?' + qs
                return redirect(dest, 301)
        try:
            return send_from_directory(app.static_folder, path)
        except:
            return render_template('404.html'), 404

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
            except Exception as e:
                db.session.rollback()
                print(f"Warning: Could not migrate bookings table: {e}")
            # migrate: align existing bookings tables with the current Booking model
            try:
                db.session.execute(db.text('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_name VARCHAR(100)'))
                db.session.execute(db.text('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_email VARCHAR(120)'))
                db.session.execute(db.text('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(30)'))
                db.session.execute(db.text('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_type VARCHAR(30)'))
                db.session.execute(db.text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'mpesa'"))
                db.session.execute(db.text('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount FLOAT DEFAULT 0'))
                db.session.execute(db.text(
                    "UPDATE bookings SET payment_status = 'partially_paid' WHERE payment_status = 'deposit_paid'"
                ))
                db.session.execute(db.text("""
                    DO $$
                    DECLARE constraint_name text;
                    BEGIN
                        FOR constraint_name IN
                            SELECT conname
                            FROM pg_constraint
                            WHERE conrelid = 'bookings'::regclass
                              AND contype = 'c'
                              AND pg_get_constraintdef(oid) ILIKE '%payment_status%'
                        LOOP
                            EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT %I', constraint_name);
                        END LOOP;
                    END $$;
                """))
                db.session.execute(db.text(
                    "ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check "
                    "CHECK (payment_status IN ('unpaid', 'partially_paid', 'fully_paid', 'refunded'))"
                ))
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Warning: Could not migrate payments constraints: {e}")
            # migrate: align payments constraints with accepted payment route values
            try:
                db.session.execute(db.text(
                    "UPDATE payments SET payment_type = 'partial' WHERE payment_type = 'deposit'"
                ))
                db.session.execute(db.text("""
                    DO $$
                    DECLARE constraint_name text;
                    BEGIN
                        FOR constraint_name IN
                            SELECT conname
                            FROM pg_constraint
                            WHERE conrelid = 'payments'::regclass
                              AND contype = 'c'
                              AND (
                                  pg_get_constraintdef(oid) ILIKE '%payment_method%'
                                  OR pg_get_constraintdef(oid) ILIKE '%payment_type%'
                              )
                        LOOP
                            EXECUTE format('ALTER TABLE payments DROP CONSTRAINT %I', constraint_name);
                        END LOOP;
                    END $$;
                """))
                db.session.execute(db.text(
                    "ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check "
                    "CHECK (payment_method IN ('mpesa', 'cash', 'card', 'paypal', 'bank_transfer'))"
                ))
                db.session.execute(db.text(
                    "ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check "
                    "CHECK (payment_type IN ('full', 'refund', 'partial'))"
                ))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add wildlife column to tours if missing
            try:
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS wildlife TEXT'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add original_price and discount_pct to tours
            try:
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2)'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS discount_pct INTEGER'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add slug to tours and hotels
            try:
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE'))
                db.session.execute(db.text('ALTER TABLE hotels ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE'))
                db.session.commit()
                # generate slugs for existing tours without one
                from models.tour import slugify as tour_slugify
                tours_no_slug = db.session.execute(
                    db.text("SELECT id, title FROM tours WHERE slug IS NULL OR slug = ''")
                ).fetchall()
                for row in tours_no_slug:
                    base = tour_slugify(row[1])
                    slug = base
                    counter = 1
                    while db.session.execute(
                        db.text("SELECT 1 FROM tours WHERE slug = :s AND id != :id"),
                        {'s': slug, 'id': row[0]}
                    ).fetchone():
                        slug = f'{base}-{counter}'
                        counter += 1
                    db.session.execute(
                        db.text("UPDATE tours SET slug = :s WHERE id = :id"),
                        {'s': slug, 'id': row[0]}
                    )
                # generate slugs for existing hotels without one
                from models.hotel import slugify as hotel_slugify
                hotels_no_slug = db.session.execute(
                    db.text("SELECT id, name FROM hotels WHERE slug IS NULL OR slug = ''")
                ).fetchall()
                for row in hotels_no_slug:
                    base = hotel_slugify(row[1])
                    slug = base
                    counter = 1
                    while db.session.execute(
                        db.text("SELECT 1 FROM hotels WHERE slug = :s AND id != :id"),
                        {'s': slug, 'id': row[0]}
                    ).fetchone():
                        slug = f'{base}-{counter}'
                        counter += 1
                    db.session.execute(
                        db.text("UPDATE hotels SET slug = :s WHERE id = :id"),
                        {'s': slug, 'id': row[0]}
                    )
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add new location fields to tours
            try:
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS location_name VARCHAR(255)'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS formatted_address VARCHAR(500)'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS county VARCHAR(100)'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS country VARCHAR(100)'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS place_id VARCHAR(255)'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS meeting_point_name VARCHAR(255)'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS meeting_address VARCHAR(500)'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS meeting_latitude DOUBLE PRECISION'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS meeting_longitude DOUBLE PRECISION'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS meeting_place_id VARCHAR(255)'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add new location fields to hotels
            try:
                db.session.execute(db.text('ALTER TABLE hotels ADD COLUMN IF NOT EXISTS location_name VARCHAR(255)'))
                db.session.execute(db.text('ALTER TABLE hotels ADD COLUMN IF NOT EXISTS formatted_address VARCHAR(500)'))
                db.session.execute(db.text('ALTER TABLE hotels ADD COLUMN IF NOT EXISTS county VARCHAR(100)'))
                db.session.execute(db.text('ALTER TABLE hotels ADD COLUMN IF NOT EXISTS country VARCHAR(100)'))
                db.session.execute(db.text('ALTER TABLE hotels ADD COLUMN IF NOT EXISTS place_id VARCHAR(255)'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add lat/lng to tours
            try:
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION'))
                db.session.execute(db.text('ALTER TABLE tours ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add lat/lng to hotels
            try:
                db.session.execute(db.text('ALTER TABLE hotels ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION'))
                db.session.execute(db.text('ALTER TABLE hotels ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add new columns to destinations
            try:
                db.session.execute(db.text('ALTER TABLE destinations ADD COLUMN IF NOT EXISTS location_text VARCHAR(255)'))
                db.session.execute(db.text('ALTER TABLE destinations ADD COLUMN IF NOT EXISTS description TEXT'))
                db.session.execute(db.text('ALTER TABLE destinations ADD COLUMN IF NOT EXISTS link_url VARCHAR(500)'))
                db.session.execute(db.text('ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE'))
                db.session.execute(db.text('ALTER TABLE destinations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION'))
                db.session.execute(db.text('ALTER TABLE destinations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: create offer_services table
            try:
                db.session.execute(db.text('''CREATE TABLE IF NOT EXISTS offer_services (
                    id VARCHAR(36) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    image_url VARCHAR(500),
                    link_url VARCHAR(500),
                    sort_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )'''))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: create testimonials table
            try:
                db.session.execute(db.text('''CREATE TABLE IF NOT EXISTS testimonials (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    location VARCHAR(255),
                    text TEXT NOT NULL,
                    rating INTEGER DEFAULT 5,
                    initials VARCHAR(10),
                    sort_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )'''))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: create page_sections table
            try:
                db.session.execute(db.text('''CREATE TABLE IF NOT EXISTS page_sections (
                    id VARCHAR(36) PRIMARY KEY,
                    section_key VARCHAR(100) UNIQUE NOT NULL,
                    title VARCHAR(255),
                    subtitle VARCHAR(500),
                    heading VARCHAR(500),
                    description TEXT,
                    grey_heading VARCHAR(255),
                    image_url VARCHAR(500),
                    cta_text VARCHAR(100),
                    cta_url VARCHAR(500),
                    stat1_number INTEGER,
                    stat1_label VARCHAR(100),
                    stat2_number INTEGER,
                    stat2_label VARCHAR(100),
                    stat3_number INTEGER,
                    stat3_label VARCHAR(100),
                    extra_json TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )'''))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: add likes, dislikes, admin_reply to reviews
            try:
                db.session.execute(db.text('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0'))
                db.session.execute(db.text('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0'))
                db.session.execute(db.text('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT'))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # migrate: sync existing tour activity_types into activity_types table
            try:
                from models.activity_type import ActivityType
                existing_types = db.session.query(Tour.activity_type).distinct().filter(Tour.activity_type.isnot(None)).all()
                for (tname,) in existing_types:
                    if tname and not ActivityType.query.filter_by(name=tname).first():
                        db.session.add(ActivityType(name=tname))
                db.session.commit()
            except Exception:
                db.session.rollback()
            # seed default activity types if table is empty
            try:
                from models.activity_type import ActivityType
                if ActivityType.query.count() == 0:
                    defaults = ['safari', 'trekking', 'beach', 'cultural', 'honeymoon', 'group', 'flying', 'museums']
                    for name in defaults:
                        db.session.add(ActivityType(name=name))
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
