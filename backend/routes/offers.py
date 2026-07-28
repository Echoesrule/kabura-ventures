import os
from flask import Blueprint, request, jsonify
from models.offer_service import OfferService
from models import db
from middleware.auth import admin_required
from services.storage import save_image, delete_image
from utils.helpers import validate_required_fields, sanitize_input, allowed_file

offers_bp = Blueprint('offers', __name__, url_prefix='/api/offers')

@offers_bp.route('', methods=['GET'])
def get_offers():
    offers = OfferService.query.filter_by(is_active=True).order_by(OfferService.sort_order.asc()).all()
    return jsonify({'offers': [o.to_dict() for o in offers]}), 200

@offers_bp.route('/all', methods=['GET'])
@admin_required
def get_all_offers(current_user):
    offers = OfferService.query.order_by(OfferService.sort_order.asc()).all()
    return jsonify({'offers': [o.to_dict() for o in offers]}), 200

@offers_bp.route('', methods=['POST'])
@admin_required
def create_offer(current_user):
    data = request.form if request.form else request.get_json()
    missing = validate_required_fields(data, ['title'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    title = sanitize_input(data.get('title', ''), max_length=255)
    description = sanitize_input(data.get('description', ''), max_length=1000)
    link_url = data.get('link_url', '')
    sort_order = data.get('sort_order', 0, type=int)

    image_url = data.get('image_url', '')
    if request.files and 'image' in request.files:
        file = request.files['image']
        if file.filename and allowed_file(file.filename):
            image_url = save_image(file, 'offers')

    offer = OfferService(
        title=title, description=description,
        image_url=image_url, link_url=link_url, sort_order=sort_order
    )
    db.session.add(offer)
    db.session.commit()

    return jsonify({'message': 'Offer created', 'offer': offer.to_dict()}), 201

@offers_bp.route('/<offer_id>', methods=['PUT'])
@admin_required
def update_offer(current_user, offer_id):
    offer = OfferService.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found'}), 404

    data = request.form if request.form else request.get_json()

    if 'title' in data:
        offer.title = sanitize_input(data['title'], max_length=255)
    if 'description' in data:
        offer.description = sanitize_input(data['description'], max_length=1000)
    if 'link_url' in data:
        offer.link_url = data['link_url']
    if 'sort_order' in data:
        offer.sort_order = int(data['sort_order'])
    if 'is_active' in data:
        offer.is_active = data['is_active'] in (True, 'true', '1', 1)
    if 'image_url' in data and data['image_url']:
        offer.image_url = data['image_url']

    if request.files and 'image' in request.files:
        file = request.files['image']
        if file.filename and allowed_file(file.filename):
            image_url = save_image(file, 'offers')
            if image_url:
                if offer.image_url and '/assets/images/' in offer.image_url:
                    delete_image(offer.image_url)
                offer.image_url = image_url

    db.session.commit()
    return jsonify({'message': 'Offer updated', 'offer': offer.to_dict()}), 200

@offers_bp.route('/<offer_id>', methods=['DELETE'])
@admin_required
def delete_offer(current_user, offer_id):
    offer = OfferService.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found'}), 404
    if offer.image_url and '/assets/images/' in offer.image_url:
        delete_image(offer.image_url)
    db.session.delete(offer)
    db.session.commit()
    return jsonify({'message': 'Offer deleted'}), 200
