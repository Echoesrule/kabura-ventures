import uuid
from datetime import datetime
from . import db

class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    tour_id = db.Column(db.String(36), db.ForeignKey('tours.id'), nullable=True)
    hotel_id = db.Column(db.String(36), db.ForeignKey('hotels.id'), nullable=True)
    booking_type = db.Column(db.String(20), nullable=False)
    travel_date = db.Column(db.Date, nullable=False)
    return_date = db.Column(db.Date, nullable=True)
    people_count = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default='pending')
    payment_status = db.Column(db.String(20), default='unpaid')
    special_requests = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='bookings', lazy='select')
    tour = db.relationship('Tour', backref='bookings', lazy='select')
    hotel = db.relationship('Hotel', backref='bookings', lazy='select')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'tour_id': self.tour_id,
            'hotel_id': self.hotel_id,
            'booking_type': self.booking_type,
            'travel_date': self.travel_date.isoformat() if self.travel_date else None,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'people_count': self.people_count,
            'status': self.status,
            'payment_status': self.payment_status,
            'special_requests': self.special_requests,
            'user': self.user.to_dict() if self.user else None,
            'tour': self.tour.to_dict() if self.tour else None,
            'hotel': self.hotel.to_dict() if self.hotel else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
