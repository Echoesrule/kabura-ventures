from flask import Blueprint, request, jsonify
from models.offer_service import OfferService
from models import db

offers_bp = Blueprint('offers', __name__, url_prefix='/api/offers')

@offers_bp.route('', methods=['GET'])
def get_offers():
    offers = OfferService.query.filter_by(is_active=True).order_by(OfferService.sort_order.asc()).all()
    return jsonify({'offers': [o.to_dict() for o in offers]}), 200
