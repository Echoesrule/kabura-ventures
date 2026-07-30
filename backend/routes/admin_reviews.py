from flask import Blueprint, request, jsonify
from models.review import Review
from middleware.auth import admin_required
from services import review_service
from services.base import ServiceError

admin_reviews_bp = Blueprint('admin_reviews', __name__, url_prefix='/api/admin/reviews')

@admin_reviews_bp.route('/<review_id>/reply', methods=['POST'])
@admin_required
def admin_reply_review(current_user, review_id):
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    try:
        data = request.get_json()
        result, status = review_service.reply_to_review(review, data.get('reply'))
        return jsonify({'message': 'Reply added', 'review': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_reviews_bp.route('/seed', methods=['POST'])
@admin_required
def seed_reviews(current_user):
    try:
        count = request.args.get('count', 50, type=int)
        result, status = review_service.seed_reviews(count)
        return jsonify({'message': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_reviews_bp.route('/seed-all', methods=['POST'])
@admin_required
def seed_all(current_user):
    try:
        users = request.args.get('users', 50, type=int)
        reviews = request.args.get('reviews', 50, type=int)
        result, status = review_service.seed_all(users, reviews)
        return jsonify({'message': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code
