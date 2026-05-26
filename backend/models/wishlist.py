import uuid
from datetime import datetime
from . import db

class Wishlist(db.Model):
    __tablename__ = 'wishlist'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    tour_id = db.Column(db.String(36), db.ForeignKey('tours.id'), nullable=True)
    hotel_id = db.Column(db.String(36), db.ForeignKey('hotels.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'tour_id', name='uq_user_tour'),
        db.UniqueConstraint('user_id', 'hotel_id', name='uq_user_hotel'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'tour_id': self.tour_id,
            'hotel_id': self.hotel_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
