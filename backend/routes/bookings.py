import traceback
from flask import Blueprint, request, jsonify
from models.booking import Booking
from models.message import Notification
from models import db
from middleware.auth import token_required
from middleware.rate_limit import rate_limit
from utils.helpers import validate_required_fields, sanitize_input, validate_length, validate_number

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')

BOOKING_PAYMENT_METHOD_ALIASES = {
    'mpesa': 'mpesa',
    'cash': 'cash',
    'cash_on_arrival': 'cash',
    'card': 'card',
    'paypal': 'paypal',
    'bank_transfer': 'bank_transfer',
}

def normalize_booking_payment_method(value):
    method = sanitize_input(value or 'mpesa', max_length=30).lower()
    return BOOKING_PAYMENT_METHOD_ALIASES.get(method)

@bookings_bp.route('', methods=['POST'])
@token_required
@rate_limit(config_key='bookings', key_prefix='create_booking')
def create_booking(current_user):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        missing = validate_required_fields(data, ['booking_type', 'travel_date', 'people_count'])
        if missing:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

        valid_types = ['tour', 'hotel', 'flight', 'package']
        if data['booking_type'] not in valid_types:
            return jsonify({'error': f'Invalid booking type. Must be one of: {", ".join(valid_types)}'}), 400

        payment_method = normalize_booking_payment_method(data.get('payment_method'))
        if not payment_method:
            valid_methods = ', '.join(BOOKING_PAYMENT_METHOD_ALIASES.keys())
            return jsonify({'error': f'Invalid payment method. Must be one of: {valid_methods}'}), 400

        errors = []
        people_err = validate_number(data['people_count'], min_val=1, max_val=100, field_name='People count')
        if people_err: errors.append(people_err)
        special = sanitize_input(data.get('special_requests', ''), max_length=1000)
        special_err = validate_length(special, 1000, 'Special requests')
        if special_err: errors.append(special_err)
        if errors:
            return jsonify({'error': '. '.join(errors)}), 400

        booking = Booking(
            user_id=current_user['user_id'],
            tour_id=data.get('tour_id'),
            hotel_id=data.get('hotel_id'),
            booking_type=data['booking_type'],
            travel_date=sanitize_input(data['travel_date']),
            return_date=sanitize_input(data.get('return_date')) if data.get('return_date') else None,
            people_count=int(data['people_count']),
            special_requests=special,
            guest_name=sanitize_input(data.get('guest_name', ''), max_length=100),
            guest_email=sanitize_input(data.get('guest_email', ''), max_length=120),
            guest_phone=sanitize_input(data.get('guest_phone', ''), max_length=30),
            room_type=data.get('room_type'),
            payment_method=payment_method,
            payment_type=sanitize_input(data.get('payment_type', 'full'), max_length=10),
            coupon_code=sanitize_input(data.get('coupon_code', ''), max_length=50),
            nationality=sanitize_input(data.get('nationality', ''), max_length=100),
            total_amount=float(data.get('total_amount', 0)),
            status='pending',
            payment_status='unpaid'
        )

        db.session.add(booking)
        db.session.commit()

        return jsonify({'message': 'Booking created successfully', 'booking': booking.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': f'Booking creation failed: {str(e)}'}), 500

@bookings_bp.route('/user', methods=['GET'])
@token_required
def get_user_bookings(current_user):
    try:
        bookings = Booking.query.filter_by(user_id=current_user['user_id'])\
            .order_by(Booking.created_at.desc()).all()
        return jsonify({'bookings': [b.to_dict() for b in bookings]}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Failed to load bookings: {str(e)}'}), 500

@bookings_bp.route('/<booking_id>', methods=['GET'])
@token_required
def get_booking(current_user, booking_id):
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        if booking.user_id != current_user['user_id'] and current_user['role'] != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        return jsonify({'booking': booking.to_dict()}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to retrieve booking'}), 500


