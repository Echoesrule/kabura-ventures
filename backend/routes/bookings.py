import traceback
from datetime import datetime
from flask import Blueprint, request, jsonify
from models.booking import Booking
from models.tour import Tour
from models.hotel import Hotel
from models.message import Notification
from models import db
from middleware.auth import token_required
from middleware.rate_limit import rate_limit
from utils.helpers import validate_required_fields, sanitize_input, validate_length, validate_number, validate_date_format

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


def compute_total_amount(booking_type, tour, hotel, people_count, travel_date, return_date):
    """Compute the booking price server-side. Client-supplied amounts are never trusted."""
    people_count = max(1, int(people_count))
    if booking_type == 'tour' and tour and tour.price:
        return float(tour.price) * people_count
    if booking_type == 'hotel' and hotel and hotel.price_per_night:
        nights = 1
        if travel_date and return_date:
            try:
                start = datetime.strptime(travel_date, '%Y-%m-%d').date()
                end = datetime.strptime(return_date, '%Y-%m-%d').date()
                nights = max(1, (end - start).days)
            except (TypeError, ValueError):
                nights = 1
        return float(hotel.price_per_night) * nights
    if booking_type == 'package' and tour and tour.price:
        return float(tour.price) * people_count
    return 0

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

        payment_type = sanitize_input(data.get('payment_type', 'full'), max_length=10).lower()
        if payment_type == 'deposit':
            payment_type = 'partial'
        if payment_type not in ('full', 'partial'):
            return jsonify({'error': 'Invalid payment type. Must be one of: full, deposit'}), 400

        travel_date = sanitize_input(data.get('travel_date', ''), max_length=10)
        return_date = sanitize_input(data.get('return_date') or '', max_length=10) or None
        if not validate_date_format(travel_date):
            return jsonify({'error': 'Invalid travel date. Use YYYY-MM-DD.'}), 400
        if return_date and not validate_date_format(return_date):
            return jsonify({'error': 'Invalid return date. Use YYYY-MM-DD.'}), 400

        # Validate referenced tour/hotel exists and matches the booking type.
        tour = None
        hotel = None
        if data['booking_type'] == 'tour':
            if not data.get('tour_id'):
                return jsonify({'error': 'tour_id is required for tour bookings'}), 400
            tour = Tour.query.get(data['tour_id'])
            if not tour:
                return jsonify({'error': 'Tour not found'}), 404
        elif data['booking_type'] == 'hotel':
            if not data.get('hotel_id'):
                return jsonify({'error': 'hotel_id is required for hotel bookings'}), 400
            hotel = Hotel.query.get(data['hotel_id'])
            if not hotel:
                return jsonify({'error': 'Hotel not found'}), 404
        elif data['booking_type'] == 'package' and data.get('tour_id'):
            tour = Tour.query.get(data['tour_id'])

        errors = []
        people_err = validate_number(data['people_count'], min_val=1, max_val=100, field_name='People count')
        if people_err: errors.append(people_err)
        special = sanitize_input(data.get('special_requests', ''), max_length=1000)
        special_err = validate_length(special, 1000, 'Special requests')
        if special_err: errors.append(special_err)
        if errors:
            return jsonify({'error': '. '.join(errors)}), 400

        total_amount = compute_total_amount(
            data['booking_type'], tour, hotel,
            data['people_count'], travel_date, return_date
        )

        booking = Booking(
            user_id=current_user['user_id'],
            tour_id=data.get('tour_id'),
            hotel_id=data.get('hotel_id'),
            booking_type=data['booking_type'],
            travel_date=travel_date,
            return_date=return_date,
            people_count=int(data['people_count']),
            special_requests=special,
            guest_name=sanitize_input(data.get('guest_name', ''), max_length=100),
            guest_email=sanitize_input(data.get('guest_email', ''), max_length=120),
            guest_phone=sanitize_input(data.get('guest_phone', ''), max_length=30),
            room_type=sanitize_input(data.get('room_type') or '', max_length=30) or None,
            payment_method=payment_method,
            payment_type=payment_type,
            coupon_code=sanitize_input(data.get('coupon_code', ''), max_length=50),
            nationality=sanitize_input(data.get('nationality', ''), max_length=100),
            total_amount=total_amount,
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

@bookings_bp.route('', methods=['GET'])
@token_required
def get_my_bookings(current_user):
    try:
        bookings = Booking.query.filter_by(user_id=current_user['user_id'])\
            .order_by(Booking.created_at.desc()).all()
        return jsonify({'bookings': [b.to_dict() for b in bookings]}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Failed to load bookings: {str(e)}'}), 500

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

CANCELLABLE_STATUSES = {'pending', 'confirmed'}

@bookings_bp.route('/<booking_id>/cancel', methods=['PUT'])
@token_required
def cancel_booking(current_user, booking_id):
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        if booking.user_id != current_user['user_id'] and current_user['role'] != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        if booking.status == 'cancelled':
            return jsonify({'error': 'Booking is already cancelled'}), 400
        if booking.status not in CANCELLABLE_STATUSES:
            return jsonify({'error': f'Cannot cancel a booking with status: {booking.status}'}), 400
        booking.status = 'cancelled'
        db.session.commit()
        return jsonify({'message': 'Booking cancelled successfully', 'booking': booking.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': f'Failed to cancel booking: {str(e)}'}), 500


