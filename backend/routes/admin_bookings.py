from flask import Blueprint, request, jsonify
from models.booking import Booking
from models import db
from middleware.auth import admin_required
from services import booking_service
from services.base import ServiceError

admin_bookings_bp = Blueprint('admin_bookings', __name__, url_prefix='/api/admin/bookings')

@admin_bookings_bp.route('', methods=['GET'])
@admin_required
def get_all_bookings(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        booking_type = request.args.get('booking_type')
        bookings, pagination = booking_service.get_all_bookings(page, per_page, status, booking_type)
        return jsonify({'bookings': bookings, **pagination}), 200
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_bookings_bp.route('/<booking_id>/status', methods=['PUT'])
@admin_required
def update_booking_status(current_user, booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        booking_service.update_booking_status(booking, data)
        return jsonify({'message': 'Booking updated', 'booking': booking.to_dict()}), 200
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code
