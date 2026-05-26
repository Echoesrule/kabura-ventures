import uuid
from datetime import datetime
from . import db

class FlightRequest(db.Model):
    __tablename__ = 'flight_requests'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    from_location = db.Column(db.String(255), nullable=False)
    to_location = db.Column(db.String(255), nullable=False)
    departure_date = db.Column(db.Date, nullable=False)
    return_date = db.Column(db.Date, nullable=True)
    passengers = db.Column(db.Integer, default=1)
    travel_class = db.Column(db.String(50), default='economy')
    status = db.Column(db.String(20), default='pending')
    admin_notes = db.Column(db.Text)
    price_quote = db.Column(db.Numeric(12, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='flight_requests', lazy='select')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'from_location': self.from_location,
            'to_location': self.to_location,
            'departure_date': self.departure_date.isoformat() if self.departure_date else None,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'passengers': self.passengers,
            'travel_class': self.travel_class,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'price_quote': float(self.price_quote) if self.price_quote else None,
            'user': self.user.to_dict() if self.user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
