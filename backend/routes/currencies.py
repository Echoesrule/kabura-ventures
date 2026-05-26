from flask import Blueprint, jsonify
from models.currency import ExchangeRate
from models import db

currencies_bp = Blueprint('currencies', __name__, url_prefix='/api/currencies')

@currencies_bp.route('', methods=['GET'])
def get_currencies():
    rates = ExchangeRate.query.all()
    if not rates:
        rates = [
            ExchangeRate(currency_code='KES', rate_to_kes=1.0, symbol='KSh'),
            ExchangeRate(currency_code='USD', rate_to_kes=130.0, symbol='$'),
            ExchangeRate(currency_code='EUR', rate_to_kes=142.0, symbol='\u20ac'),
        ]
        for r in rates:
            db.session.add(r)
        db.session.commit()
    return jsonify({'currencies': [r.to_dict() for r in rates]}), 200
