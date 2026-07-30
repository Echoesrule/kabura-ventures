from flask import Blueprint, request, jsonify
from models.tour import Tour
from models import db
from middleware.auth import admin_required
from services import availability_service
from services.base import ServiceError

admin_availability_bp = Blueprint('admin_availability', __name__, url_prefix='/api/admin/availability')

@admin_availability_bp.route('/<tour_id>/generate', methods=['POST'])
@admin_required
def generate_availability(current_user, tour_id):
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({'error': 'Tour not found'}), 404
    try:
        data = request.get_json() or {}
        count = availability_service.generate_availability(
            tour, int(data.get('months', 3)), int(data.get('slots', tour.max_people))
        )
        return jsonify({'message': f'Generated {count} availability entries'}), 201
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code
