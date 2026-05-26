from flask import Blueprint, request, jsonify
from models.wishlist import Wishlist
from models.tour import Tour
from models.hotel import Hotel
from models import db
from middleware.auth import token_required

wishlist_bp = Blueprint('wishlist', __name__, url_prefix='/api/wishlist')

@wishlist_bp.route('', methods=['GET'])
@token_required
def get_wishlist(current_user):
    items = Wishlist.query.filter_by(user_id=current_user['user_id']).order_by(Wishlist.created_at.desc()).all()
    result = []
    for item in items:
        d = item.to_dict()
        if item.tour_id:
            tour = Tour.query.get(item.tour_id)
            d['tour'] = tour.to_brief() if tour else None
        if item.hotel_id:
            hotel = Hotel.query.get(item.hotel_id)
            d['hotel'] = hotel.to_dict() if hotel else None
        result.append(d)
    return jsonify({'wishlist': result}), 200

@wishlist_bp.route('', methods=['POST'])
@token_required
def add_to_wishlist(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    if not data.get('tour_id') and not data.get('hotel_id'):
        return jsonify({'error': 'Either tour_id or hotel_id is required'}), 400

    existing = Wishlist.query.filter_by(
        user_id=current_user['user_id'],
        tour_id=data.get('tour_id'),
        hotel_id=data.get('hotel_id')
    ).first()
    if existing:
        return jsonify({'message': 'Already in wishlist', 'wishlist': existing.to_dict()}), 200

    item = Wishlist(
        user_id=current_user['user_id'],
        tour_id=data.get('tour_id'),
        hotel_id=data.get('hotel_id'),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Added to wishlist', 'wishlist': item.to_dict()}), 201

@wishlist_bp.route('/<item_id>', methods=['DELETE'])
@token_required
def remove_from_wishlist(current_user, item_id):
    item = Wishlist.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    if item.user_id != current_user['user_id']:
        return jsonify({'error': 'Access denied'}), 403
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Removed from wishlist'}), 200

@wishlist_bp.route('/check', methods=['GET'])
@token_required
def check_wishlist(current_user):
    tour_id = request.args.get('tour_id')
    hotel_id = request.args.get('hotel_id')
    query = Wishlist.query.filter_by(user_id=current_user['user_id'])
    if tour_id:
        query = query.filter_by(tour_id=tour_id)
    if hotel_id:
        query = query.filter_by(hotel_id=hotel_id)
    item = query.first()
    return jsonify({'in_wishlist': item is not None, 'id': item.id if item else None}), 200
