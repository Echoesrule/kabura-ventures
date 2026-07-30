from flask import Blueprint, request, jsonify
from models.testimonial import Testimonial
from models import db

testimonials_bp = Blueprint('testimonials', __name__, url_prefix='/api/testimonials')

@testimonials_bp.route('', methods=['GET'])
def get_testimonials():
    testimonials = Testimonial.query.filter_by(is_active=True).order_by(Testimonial.sort_order.asc()).all()
    return jsonify({'testimonials': [t.to_dict() for t in testimonials]}), 200
