from flask import Blueprint, request, jsonify
from models.testimonial import Testimonial
from models import db
from middleware.auth import admin_required
from services import testimonial_service
from services.base import ServiceError

admin_testimonials_bp = Blueprint('admin_testimonials', __name__, url_prefix='/api/admin/testimonials')

@admin_testimonials_bp.route('', methods=['GET'])
@admin_required
def get_all_testimonials_admin(current_user):
    testimonials = testimonial_service.get_all_testimonials()
    return jsonify({'testimonials': testimonials}), 200

@admin_testimonials_bp.route('', methods=['POST'])
@admin_required
def create_testimonial(current_user):
    try:
        data = request.form if request.form else request.get_json()
        result, status = testimonial_service.create_testimonial(data)
        return jsonify({'message': 'Testimonial created', 'testimonial': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_testimonials_bp.route('/<test_id>', methods=['PUT'])
@admin_required
def update_testimonial(current_user, test_id):
    testimonial = Testimonial.query.get(test_id)
    if not testimonial:
        return jsonify({'error': 'Testimonial not found'}), 404
    try:
        data = request.get_json()
        result, status = testimonial_service.update_testimonial(testimonial, data)
        return jsonify({'message': 'Testimonial updated', 'testimonial': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_testimonials_bp.route('/<test_id>', methods=['DELETE'])
@admin_required
def delete_testimonial(current_user, test_id):
    testimonial = Testimonial.query.get(test_id)
    if not testimonial:
        return jsonify({'error': 'Testimonial not found'}), 404
    testimonial_service.delete_testimonial(testimonial)
    return jsonify({'message': 'Testimonial deleted'}), 200
