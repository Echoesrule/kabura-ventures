import uuid
from datetime import datetime
from . import db

class ExchangeRate(db.Model):
    __tablename__ = 'exchange_rates'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    currency_code = db.Column(db.String(3), unique=True, nullable=False)
    rate_to_kes = db.Column(db.Numeric(12, 6), nullable=False)
    symbol = db.Column(db.String(5), nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'currency_code': self.currency_code,
            'rate_to_kes': float(self.rate_to_kes) if self.rate_to_kes else 1,
            'symbol': self.symbol
        }
