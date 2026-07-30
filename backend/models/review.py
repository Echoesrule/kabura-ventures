import uuid
from datetime import datetime
from . import db

class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    tour_id = db.Column(db.String(36), db.ForeignKey('tours.id'), nullable=True)
    hotel_id = db.Column(db.String(36), db.ForeignKey('hotels.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    likes = db.Column(db.Integer, default=0)
    dislikes = db.Column(db.Integer, default=0)
    admin_reply = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='reviews')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Anonymous',
            'tour_id': self.tour_id,
            'hotel_id': self.hotel_id,
            'rating': self.rating,
            'comment': self.comment,
            'likes': self.likes or 0,
            'dislikes': self.dislikes or 0,
            'admin_reply': self.admin_reply,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
