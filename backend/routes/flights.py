from flask import Blueprint, request, jsonify
from models.flight import FlightRequest
from models.message import Notification
from models import db
from middleware.auth import token_required, admin_required
from utils.helpers import validate_required_fields, sanitize_input, validate_length, validate_number

flights_bp = Blueprint('flights', __name__, url_prefix='/api/flights')

@flights_bp.route('/request', methods=['POST'])
@token_required
def create_flight_request(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['from_location', 'to_location', 'departure_date', 'passengers'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    errors = []
    valid_classes = ['economy', 'premium_economy', 'business', 'first']
    travel_class = sanitize_input(data.get('travel_class', 'economy'), max_length=50)
    if travel_class not in valid_classes:
        errors.append(f'Invalid travel class. Must be one of: {", ".join(valid_classes)}')
    passengers_err = validate_number(data['passengers'], min_val=1, max_val=100, field_name='Passengers')
    if passengers_err: errors.append(passengers_err)
    from_loc = sanitize_input(data['from_location'], max_length=255)
    to_loc = sanitize_input(data['to_location'], max_length=255)
    for label, val in [('From location', from_loc), ('To location', to_loc)]:
        err = validate_length(val, 255, label)
        if err: errors.append(err)
    if errors:
        return jsonify({'error': '. '.join(errors)}), 400

    flight_request = FlightRequest(
        user_id=current_user['user_id'],
        from_location=from_loc,
        to_location=to_loc,
        departure_date=sanitize_input(data['departure_date']),
        return_date=sanitize_input(data.get('return_date')) if data.get('return_date') else None,
        passengers=int(data['passengers']),
        travel_class=travel_class,
        status='pending'
    )

    db.session.add(flight_request)
    db.session.commit()

    return jsonify({
        'message': 'Flight request submitted successfully',
        'flight_request': flight_request.to_dict()
    }), 201

@flights_bp.route('', methods=['GET'])
@admin_required
def get_all_flight_requests(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')

    query = FlightRequest.query
    if status:
        query = query.filter_by(status=status)

    query = query.order_by(FlightRequest.created_at.desc())
    requests = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'flight_requests': [r.to_dict() for r in requests.items],
        'total': requests.total,
        'page': requests.page,
        'per_page': requests.per_page,
        'pages': requests.pages
    }), 200

@flights_bp.route('/user', methods=['GET'])
@token_required
def get_user_flight_requests(current_user):
    requests = FlightRequest.query.filter_by(user_id=current_user['user_id'])\
        .order_by(FlightRequest.created_at.desc()).all()
    return jsonify({'flight_requests': [r.to_dict() for r in requests]}), 200

@flights_bp.route('/<request_id>', methods=['PUT'])
@admin_required
def respond_to_flight_request(current_user, request_id):
    flight_request = FlightRequest.query.get(request_id)
    if not flight_request:
        return jsonify({'error': 'Flight request not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    valid_statuses = ['pending', 'quoted', 'approved', 'rejected', 'booked']

    if 'status' in data:
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        flight_request.status = data['status']

    if 'price_quote' in data:
        price_err = validate_number(data['price_quote'], min_val=0, field_name='Price quote')
        if price_err:
            return jsonify({'error': price_err}), 400
        flight_request.price_quote = float(data['price_quote'])
    if 'admin_notes' in data:
        flight_request.admin_notes = sanitize_input(data['admin_notes'], max_length=2000)

    db.session.commit()
    return jsonify({
        'message': 'Flight request updated',
        'flight_request': flight_request.to_dict()
    }), 200
