from flask import Blueprint, request, jsonify
from models.offer_service import OfferService
from models import db
from middleware.auth import admin_required
from services import offer_service
from services.base import ServiceError

admin_offers_bp = Blueprint('admin_offers', __name__, url_prefix='/api/admin/offers')

@admin_offers_bp.route('', methods=['GET'])
@admin_required
def get_all_offers(current_user):
    offers = offer_service.get_all_offers()
    return jsonify({'offers': offers}), 200

@admin_offers_bp.route('', methods=['POST'])
@admin_required
def create_offer(current_user):
    try:
        data = request.form if request.form else request.get_json()
        result, status = offer_service.create_offer(data, request.files)
        return jsonify({'message': 'Offer created', 'offer': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_offers_bp.route('/<offer_id>', methods=['PUT'])
@admin_required
def update_offer(current_user, offer_id):
    offer = OfferService.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found'}), 404
    try:
        data = request.form if request.form else request.get_json()
        result, status = offer_service.update_offer(offer, data, request.files)
        return jsonify({'message': 'Offer updated', 'offer': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_offers_bp.route('/<offer_id>', methods=['DELETE'])
@admin_required
def delete_offer(current_user, offer_id):
    offer = OfferService.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found'}), 404
    offer_service.delete_offer(offer)
    return jsonify({'message': 'Offer deleted'}), 200
