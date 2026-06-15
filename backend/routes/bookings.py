from flask import Blueprint, request, jsonify
from models.booking import Booking
from models.message import Notification
from models import db
from middleware.auth import token_required, admin_required
from utils.helpers import validate_required_fields, sanitize_input, validate_length, validate_number

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')

@bookings_bp.route('', methods=['POST'])
@token_required
def create_booking(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['booking_type', 'travel_date', 'people_count'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    valid_types = ['tour', 'hotel', 'flight', 'package']
    if data['booking_type'] not in valid_types:
        return jsonify({'error': f'Invalid booking type. Must be one of: {", ".join(valid_types)}'}), 400

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
        payment_method=data.get('payment_method', 'mpesa'),
        total_amount=float(data.get('total_amount', 0)),
        status='pending',
        payment_status='unpaid'
    )

    db.session.add(booking)
    db.session.commit()

    return jsonify({'message': 'Booking created successfully', 'booking': booking.to_dict()}), 201

@bookings_bp.route('/user', methods=['GET'])
@token_required
def get_user_bookings(current_user):
    bookings = Booking.query.filter_by(user_id=current_user['user_id'])\
        .order_by(Booking.created_at.desc()).all()
    return jsonify({'bookings': [b.to_dict() for b in bookings]}), 200

@bookings_bp.route('/<booking_id>', methods=['GET'])
@token_required
def get_booking(current_user, booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    if booking.user_id != current_user['user_id'] and current_user['role'] != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    return jsonify({'booking': booking.to_dict()}), 200

@bookings_bp.route('', methods=['GET'])
@admin_required
def get_all_bookings(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    booking_type = request.args.get('booking_type')

    query = Booking.query
    if status:
        query = query.filter_by(status=status)
    if booking_type:
        query = query.filter_by(booking_type=booking_type)

    query = query.order_by(Booking.created_at.desc())
    bookings = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'bookings': [b.to_dict() for b in bookings.items],
        'total': bookings.total,
        'page': bookings.page,
        'per_page': bookings.per_page,
        'pages': bookings.pages
    }), 200

@bookings_bp.route('/<booking_id>/status', methods=['PUT'])
@admin_required
def update_booking_status(current_user, booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']
    valid_payment = ['unpaid', 'partially_paid', 'fully_paid', 'refunded']

    if 'status' in data:
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        booking.status = data['status']

    if 'payment_status' in data:
        if data['payment_status'] not in valid_payment:
            return jsonify({'error': f'Invalid payment status. Must be one of: {", ".join(valid_payment)}'}), 400
        booking.payment_status = data['payment_status']

    db.session.commit()
    return jsonify({'message': 'Booking updated', 'booking': booking.to_dict()}), 200
