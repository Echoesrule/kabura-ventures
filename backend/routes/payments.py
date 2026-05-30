from flask import Blueprint, request, jsonify
from models.payment import Payment
from models.booking import Booking
from models import db
from middleware.auth import token_required, admin_required
from utils.helpers import validate_required_fields, sanitize_input, validate_length, validate_number

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route('', methods=['POST'])
@token_required
def create_payment(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['amount', 'payment_method', 'payment_type'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    valid_methods = ['mpesa', 'cash', 'card', 'paypal', 'bank_transfer']
    valid_types = ['full', 'refund', 'partial']

    if data['payment_method'] not in valid_methods:
        return jsonify({'error': f'Invalid payment method. Must be one of: {", ".join(valid_methods)}'}), 400

    if data['payment_type'] not in valid_types:
        return jsonify({'error': f'Invalid payment type. Must be one of: {", ".join(valid_types)}'}), 400

    errors = []
    amount_err = validate_number(data['amount'], min_val=0, max_val=999999999, field_name='Amount')
    if amount_err: errors.append(amount_err)
    tx_ref = sanitize_input(data.get('transaction_ref', ''), max_length=255)
    tx_err = validate_length(tx_ref, 255, 'Transaction reference')
    if tx_err: errors.append(tx_err)
    if errors:
        return jsonify({'error': '. '.join(errors)}), 400

    payment = Payment(
        booking_id=data.get('booking_id'),
        flight_request_id=data.get('flight_request_id'),
        user_id=current_user['user_id'],
        amount=float(data['amount']),
        payment_method=data['payment_method'],
        payment_type=data['payment_type'],
        status='completed' if data['payment_method'] == 'cash' else 'pending',
        transaction_ref=tx_ref
    )

    db.session.add(payment)

    if data.get('booking_id'):
        booking = Booking.query.get(data['booking_id'])
        if booking:
            if data['payment_type'] == 'full':
                booking.payment_status = 'fully_paid'
            elif data['payment_type'] == 'partial':
                booking.payment_status = 'partially_paid'

    db.session.commit()
    return jsonify({'message': 'Payment recorded', 'payment': payment.to_dict()}), 201

@payments_bp.route('', methods=['GET'])
@token_required
def get_payments(current_user):
    if current_user['role'] == 'admin':
        payments = Payment.query.order_by(Payment.created_at.desc()).all()
    else:
        payments = Payment.query.filter_by(user_id=current_user['user_id'])\
            .order_by(Payment.created_at.desc()).all()

    return jsonify({'payments': [p.to_dict() for p in payments]}), 200
