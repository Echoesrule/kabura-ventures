import uuid
import re
from datetime import datetime
from . import db

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text[:200]

class Tour(db.Model):
    __tablename__ = 'tours'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    location = db.Column(db.String(255))
    location_name = db.Column(db.String(255))
    formatted_address = db.Column(db.String(500))
    county = db.Column(db.String(100))
    country = db.Column(db.String(100))
    place_id = db.Column(db.String(255))
    meeting_point_name = db.Column(db.String(255))
    meeting_address = db.Column(db.String(500))
    meeting_latitude = db.Column(db.Float, nullable=True)
    meeting_longitude = db.Column(db.Float, nullable=True)
    meeting_place_id = db.Column(db.String(255))
    activity_type = db.Column(db.String(100), default='safari')
    max_people = db.Column(db.Integer, default=20)
    original_price = db.Column(db.Numeric(12, 2), nullable=True)
    discount_pct = db.Column(db.Integer, nullable=True)
    featured = db.Column(db.Boolean, default=False)
    available = db.Column(db.Boolean, default=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    itinerary = db.Column(db.Text)
    included = db.Column(db.Text)
    excluded = db.Column(db.Text)
    wildlife = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    images = db.relationship('TourImage', backref='tour', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='tour', lazy='dynamic', cascade='all, delete-orphan')
    availabilities = db.relationship('TourAvailability', backref='tour', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        from .review import Review
        reviews_q = Review.query.filter_by(tour_id=self.id).order_by(Review.created_at.desc()).limit(10).all()
        avg = db.session.query(db.func.avg(Review.rating)).filter(Review.tour_id == self.id).scalar() or 0
        count = Review.query.filter_by(tour_id=self.id).count()
        return {
            'id': self.id,
            'slug': self.slug,
            'title': self.title,
            'description': self.description,
            'price': float(self.price) if self.price else 0,
            'original_price': float(self.original_price) if self.original_price else None,
            'discount_pct': self.discount_pct if self.discount_pct else None,
            'duration_days': self.duration_days,
            'location': self.location,
            'location_name': self.location_name,
            'formatted_address': self.formatted_address,
            'county': self.county,
            'country': self.country,
            'place_id': self.place_id,
            'meeting_point_name': self.meeting_point_name,
            'meeting_address': self.meeting_address,
            'meeting_latitude': self.meeting_latitude,
            'meeting_longitude': self.meeting_longitude,
            'meeting_place_id': self.meeting_place_id,
            'activity_type': self.activity_type,
            'max_people': self.max_people,
            'featured': self.featured,
            'available': self.available,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'itinerary': self.itinerary,
            'included': self.included,
            'excluded': self.excluded,
            'wildlife': self.wildlife,
            'images': [img.to_dict() for img in self.images.all()],
            'reviews': [r.to_dict() for r in reviews_q],
            'avg_rating': float(avg),
            'reviews_count': count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def to_brief(self):
        from .review import Review
        avg = db.session.query(db.func.avg(Review.rating)).filter(Review.tour_id == self.id).scalar() or 0
        count = Review.query.filter_by(tour_id=self.id).count()
        return {
            'id': self.id,
            'slug': self.slug,
            'title': self.title,
            'price': float(self.price) if self.price else 0,
            'original_price': float(self.original_price) if self.original_price else None,
            'discount_pct': self.discount_pct if self.discount_pct else None,
            'duration_days': self.duration_days,
            'location': self.location,
            'activity_type': self.activity_type,
            'featured': self.featured,
            'wildlife': self.wildlife,
            'images': [img.to_dict() for img in self.images.all()],
            'avg_rating': float(avg),
            'reviews_count': count,
        }


class TourImage(db.Model):
    __tablename__ = 'tour_images'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tour_id = db.Column(db.String(36), db.ForeignKey('tours.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'tour_id': self.tour_id,
            'image_url': self.image_url,
            'is_primary': self.is_primary
        }
