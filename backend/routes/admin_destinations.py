from flask import Blueprint, request, jsonify
from models.destination import Destination
from models import db
from middleware.auth import admin_required
from services import destination_service
from services.base import ServiceError

admin_destinations_bp = Blueprint('admin_destinations', __name__, url_prefix='/api/admin/destinations')

@admin_destinations_bp.route('', methods=['GET'])
@admin_required
def get_all_destinations_admin(current_user):
    destinations = destination_service.get_all_destinations()
    return jsonify({'destinations': destinations}), 200

@admin_destinations_bp.route('', methods=['POST'])
@admin_required
def create_destination(current_user):
    try:
        data = request.form if request.form else request.get_json()
        result, status = destination_service.create_destination(data, request.files)
        return jsonify({'message': 'Destination created', 'destination': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_destinations_bp.route('/<dest_id>', methods=['PUT'])
@admin_required
def update_destination(current_user, dest_id):
    dest = Destination.query.get(dest_id)
    if not dest:
        return jsonify({'error': 'Destination not found'}), 404
    try:
        data = request.form if request.form else request.get_json()
        result, status = destination_service.update_destination(dest, data, request.files)
        return jsonify({'message': 'Destination updated', 'destination': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_destinations_bp.route('/<dest_id>', methods=['DELETE'])
@admin_required
def delete_destination(current_user, dest_id):
    dest = Destination.query.get(dest_id)
    if not dest:
        return jsonify({'error': 'Destination not found'}), 404
    destination_service.delete_destination(dest)
    return jsonify({'message': 'Destination deleted'}), 200
