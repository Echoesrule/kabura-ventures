from flask import Blueprint, request, jsonify
from models.subscriber import Subscriber
from models import db
from middleware.auth import admin_required
from utils.helpers import validate_required_fields, validate_email, sanitize_input

subscribers_bp = Blueprint('subscribers', __name__, url_prefix='/api/subscribers')

@subscribers_bp.route('', methods=['POST'])
def subscribe():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    missing = validate_required_fields(data, ['email'])
    if missing:
        return jsonify({'error': f"Missing required fields: {', '.join(missing)}"}), 400

    email = sanitize_input(data.get('email', ''), 255)
    if not validate_email(email):
        return jsonify({'error': 'A valid email address is required'}), 400

    existing = Subscriber.query.filter_by(email=email).first()
    if existing:
        return jsonify({'message': 'Already subscribed', 'subscriber': existing.to_dict()}), 200

    subscriber = Subscriber(email=email)
    db.session.add(subscriber)
    db.session.commit()

    return jsonify({'message': 'Subscribed successfully', 'subscriber': subscriber.to_dict()}), 201

@subscribers_bp.route('', methods=['GET'])
@admin_required
def get_subscribers(current_user):
    subscribers = Subscriber.query.order_by(Subscriber.created_at.desc()).all()
    return jsonify({'subscribers': [s.to_dict() for s in subscribers]}), 200
