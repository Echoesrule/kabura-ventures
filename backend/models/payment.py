import uuid
from datetime import datetime
from . import db

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = db.Column(db.String(36), db.ForeignKey('bookings.id'), nullable=True)
    flight_request_id = db.Column(db.String(36), db.ForeignKey('flight_requests.id'), nullable=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_method = db.Column(db.String(50))
    payment_type = db.Column(db.String(50))
    status = db.Column(db.String(20), default='pending')
    transaction_ref = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='payments', lazy='select')
    booking = db.relationship('Booking', backref='payments', lazy='select')

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'flight_request_id': self.flight_request_id,
            'user_id': self.user_id,
            'amount': float(self.amount) if self.amount else 0,
            'payment_method': self.payment_method,
            'payment_type': self.payment_type,
            'status': self.status,
            'transaction_ref': self.transaction_ref,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
