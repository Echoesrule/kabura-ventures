from flask import Blueprint, request, jsonify
from models.testimonial import Testimonial
from models import db
from middleware.auth import admin_required
from utils.helpers import validate_required_fields, sanitize_input

testimonials_bp = Blueprint('testimonials', __name__, url_prefix='/api/testimonials')

@testimonials_bp.route('', methods=['GET'])
def get_testimonials():
    testimonials = Testimonial.query.filter_by(is_active=True).order_by(Testimonial.sort_order.asc()).all()
    return jsonify({'testimonials': [t.to_dict() for t in testimonials]}), 200

@testimonials_bp.route('/all', methods=['GET'])
@admin_required
def get_all_testimonials(current_user):
    testimonials = Testimonial.query.order_by(Testimonial.sort_order.asc()).all()
    return jsonify({'testimonials': [t.to_dict() for t in testimonials]}), 200

@testimonials_bp.route('', methods=['POST'])
@admin_required
def create_testimonial(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['name', 'text'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    name = sanitize_input(data['name'], max_length=255)
    location = sanitize_input(data.get('location', ''), max_length=255)
    text = sanitize_input(data['text'], max_length=2000)
    rating = min(5, max(1, int(data.get('rating', 5))))
    sort_order = data.get('sort_order', 0, type=int)

    initials = data.get('initials', '').strip()
    if not initials:
        parts = name.split()
        initials = ''.join(p[0] for p in parts[:2]).upper()

    testimonial = Testimonial(
        name=name, location=location, text=text,
        rating=rating, initials=initials, sort_order=sort_order
    )
    db.session.add(testimonial)
    db.session.commit()

    return jsonify({'message': 'Testimonial created', 'testimonial': testimonial.to_dict()}), 201

@testimonials_bp.route('/<test_id>', methods=['PUT'])
@admin_required
def update_testimonial(current_user, test_id):
    testimonial = Testimonial.query.get(test_id)
    if not testimonial:
        return jsonify({'error': 'Testimonial not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'name' in data:
        testimonial.name = sanitize_input(data['name'], max_length=255)
    if 'location' in data:
        testimonial.location = sanitize_input(data['location'], max_length=255)
    if 'text' in data:
        testimonial.text = sanitize_input(data['text'], max_length=2000)
    if 'rating' in data:
        testimonial.rating = min(5, max(1, int(data['rating'])))
    if 'sort_order' in data:
        testimonial.sort_order = int(data['sort_order'])
    if 'is_active' in data:
        testimonial.is_active = data['is_active'] in (True, 'true', '1', 1)
    if 'initials' in data:
        testimonial.initials = sanitize_input(data['initials'], max_length=10)

    db.session.commit()
    return jsonify({'message': 'Testimonial updated', 'testimonial': testimonial.to_dict()}), 200

@testimonials_bp.route('/<test_id>', methods=['DELETE'])
@admin_required
def delete_testimonial(current_user, test_id):
    testimonial = Testimonial.query.get(test_id)
    if not testimonial:
        return jsonify({'error': 'Testimonial not found'}), 404
    db.session.delete(testimonial)
    db.session.commit()
    return jsonify({'message': 'Testimonial deleted'}), 200
