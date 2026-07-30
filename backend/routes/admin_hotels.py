from flask import Blueprint, request, jsonify
from models.hotel import Hotel, HotelImage
from models import db
from middleware.auth import admin_required
from services import hotel_service
from services.base import ServiceError

admin_hotels_bp = Blueprint('admin_hotels', __name__, url_prefix='/api/admin/hotels')

@admin_hotels_bp.route('', methods=['POST'])
@admin_required
def create_hotel(current_user):
    try:
        data = request.form if request.form else request.get_json()
        files = request.files.getlist('images') if request.files else None
        result, status = hotel_service.create_hotel(data, files)
        return jsonify({'message': 'Hotel created', 'hotel': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_hotels_bp.route('/<hotel_id>', methods=['PUT', 'POST'])
@admin_required
def update_hotel(current_user, hotel_id):
    hotel = Hotel.query.get(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404
    try:
        data = request.form if request.form else request.get_json()
        files = request.files.getlist('images') if request.files else None
        result, status = hotel_service.update_hotel(hotel, data, files)
        return jsonify({'message': 'Hotel updated', 'hotel': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_hotels_bp.route('/<hotel_id>', methods=['DELETE'])
@admin_required
def delete_hotel(current_user, hotel_id):
    hotel = Hotel.query.get(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404
    hotel_service.delete_hotel(hotel)
    return jsonify({'message': 'Hotel deleted'}), 200

@admin_hotels_bp.route('/images/<image_id>', methods=['DELETE'])
@admin_required
def delete_hotel_image(current_user, image_id):
    image = HotelImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    hotel_service.delete_hotel_image(image)
    return jsonify({'message': 'Image deleted'}), 200

@admin_hotels_bp.route('/images/<image_id>/primary', methods=['PUT'])
@admin_required
def set_hotel_primary_image(current_user, image_id):
    image = HotelImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    hotel_service.set_hotel_primary_image(image)
    return jsonify({'message': 'Primary image updated'}), 200
