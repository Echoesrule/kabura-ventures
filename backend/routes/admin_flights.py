from flask import Blueprint, request, jsonify
from models.flight import FlightRequest
from models import db
from middleware.auth import admin_required
from services import flight_service
from services.base import ServiceError

admin_flights_bp = Blueprint('admin_flights', __name__, url_prefix='/api/admin/flights')

@admin_flights_bp.route('', methods=['GET'])
@admin_required
def get_all_flight_requests(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    requests, pagination = flight_service.get_all_flight_requests(page, per_page, status)
    return jsonify({'flight_requests': requests, **pagination}), 200

@admin_flights_bp.route('/<request_id>', methods=['PUT'])
@admin_required
def respond_to_flight_request(current_user, request_id):
    flight_request = FlightRequest.query.get(request_id)
    if not flight_request:
        return jsonify({'error': 'Flight request not found'}), 404
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        flight_service.respond_to_flight_request(flight_request, data)
        return jsonify({'message': 'Flight request updated', 'flight_request': flight_request.to_dict()}), 200
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code
