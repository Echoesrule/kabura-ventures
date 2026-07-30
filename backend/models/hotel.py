import uuid
import re
from datetime import datetime
from . import db

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text[:200]

class Hotel(db.Model):
    __tablename__ = 'hotels'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(255))
    location_name = db.Column(db.String(255))
    formatted_address = db.Column(db.String(500))
    county = db.Column(db.String(100))
    country = db.Column(db.String(100))
    place_id = db.Column(db.String(255))
    price_per_night = db.Column(db.Numeric(12, 2), nullable=False)
    rating = db.Column(db.Numeric(2, 1), default=0.0)
    amenities = db.Column(db.Text)
    available = db.Column(db.Boolean, default=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    images = db.relationship('HotelImage', backref='hotel', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='hotel', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        from .review import Review
        avg = db.session.query(db.func.avg(Review.rating)).filter(Review.hotel_id == self.id).scalar() or 0
        count = Review.query.filter_by(hotel_id=self.id).count()
        return {
            'id': self.id,
            'slug': self.slug,
            'name': self.name,
            'description': self.description,
            'location': self.location,
            'location_name': self.location_name,
            'formatted_address': self.formatted_address,
            'county': self.county,
            'country': self.country,
            'place_id': self.place_id,
            'price_per_night': float(self.price_per_night) if self.price_per_night else 0,
            'rating': float(self.rating) if self.rating else 0,
            'amenities': self.amenities.split(',') if self.amenities else [],
            'available': self.available,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'images': [img.to_dict() for img in self.images.all()],
            'avg_rating': float(avg),
            'reviews_count': count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class HotelImage(db.Model):
    __tablename__ = 'hotel_images'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hotel_id = db.Column(db.String(36), db.ForeignKey('hotels.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'hotel_id': self.hotel_id,
            'image_url': self.image_url,
            'is_primary': self.is_primary
        }
