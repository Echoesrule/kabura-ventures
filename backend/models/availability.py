import uuid
from datetime import datetime
from . import db

class TourAvailability(db.Model):
    __tablename__ = 'tour_availability'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tour_id = db.Column(db.String(36), db.ForeignKey('tours.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    available_slots = db.Column(db.Integer, nullable=False)
    max_people = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('tour_id', 'date', name='uq_tour_date'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'tour_id': self.tour_id,
            'date': self.date.isoformat() if self.date else None,
            'available_slots': self.available_slots,
            'max_people': self.max_people
        }
