import uuid
from datetime import datetime
from . import db

class Testimonial(db.Model):
    __tablename__ = 'testimonials'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255), nullable=True)
    text = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, default=5)
    initials = db.Column(db.String(10), nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location or '',
            'text': self.text,
            'rating': self.rating,
            'initials': self.initials or '',
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
