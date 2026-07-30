from flask import Blueprint, request, jsonify
from models.tour import Tour, TourImage
from models.activity_type import ActivityType
from models import db
from middleware.auth import admin_required
from services import tour_service
from services.base import ServiceError

admin_tours_bp = Blueprint('admin_tours', __name__, url_prefix='/api/admin/tours')

@admin_tours_bp.route('', methods=['POST'])
@admin_required
def create_tour(current_user):
    try:
        data = request.form if request.form else request.get_json()
        files = request.files.getlist('images') if request.files else None
        result, status = tour_service.create_tour(data, files)
        return jsonify({'message': 'Tour created', 'tour': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_tours_bp.route('/<tour_id>', methods=['PUT', 'POST'])
@admin_required
def update_tour(current_user, tour_id):
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({'error': 'Tour not found'}), 404
    try:
        data = request.form if request.form else request.get_json()
        files = request.files.getlist('images') if request.files else None
        result, status = tour_service.update_tour(tour, data, files)
        return jsonify({'message': 'Tour updated', 'tour': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_tours_bp.route('/<tour_id>', methods=['DELETE'])
@admin_required
def delete_tour(current_user, tour_id):
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({'error': 'Tour not found'}), 404
    tour_service.delete_tour(tour)
    return jsonify({'message': 'Tour deleted'}), 200

@admin_tours_bp.route('/images/<image_id>', methods=['DELETE'])
@admin_required
def delete_tour_image(current_user, image_id):
    image = TourImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    tour_service.delete_tour_image(image)
    return jsonify({'message': 'Image deleted'}), 200

@admin_tours_bp.route('/images/<image_id>/primary', methods=['PUT'])
@admin_required
def set_tour_primary_image(current_user, image_id):
    image = TourImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    tour_service.set_tour_primary_image(image)
    return jsonify({'message': 'Primary image updated'}), 200

@admin_tours_bp.route('/activity-types', methods=['POST'])
@admin_required
def create_activity_type(current_user):
    try:
        data = request.get_json() if request.is_json else request.form
        result, status = tour_service.create_activity_type(data.get('name', ''))
        return jsonify({'message': f'Activity type created', 'type': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_tours_bp.route('/activity-types/<path:name>', methods=['DELETE'])
@admin_required
def delete_activity_type(current_user, name):
    try:
        tour_service.delete_activity_type(name)
        return jsonify({'message': f'Activity type removed'}), 200
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code
