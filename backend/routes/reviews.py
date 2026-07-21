from flask import Blueprint, request, jsonify
from models.review import Review
from models import db
from middleware.auth import token_required
from utils.helpers import validate_required_fields, sanitize_input, validate_number

reviews_bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')

@reviews_bp.route('', methods=['GET'])
def get_reviews():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    tour_id = request.args.get('tour_id')
    hotel_id = request.args.get('hotel_id')

    query = Review.query

    if tour_id:
        query = query.filter_by(tour_id=tour_id)
    if hotel_id:
        query = query.filter_by(hotel_id=hotel_id)

    reviews = query.order_by(Review.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'reviews': [r.to_dict() for r in reviews.items],
        'total': reviews.total,
        'page': reviews.page,
        'pages': reviews.pages
    }), 200

@reviews_bp.route('', methods=['POST'])
@token_required
def create_review(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['rating'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    if not data.get('tour_id') and not data.get('hotel_id'):
        return jsonify({'error': 'Either tour_id or hotel_id is required'}), 400

    rating_err = validate_number(data['rating'], min_val=1, max_val=5, field_name='Rating')
    if rating_err:
        return jsonify({'error': rating_err}), 400

    existing = Review.query.filter_by(
        user_id=current_user['user_id'],
        tour_id=data.get('tour_id'),
        hotel_id=data.get('hotel_id')
    ).first()
    if existing:
        return jsonify({'error': 'You have already reviewed this item'}), 409

    review = Review(
        user_id=current_user['user_id'],
        tour_id=data.get('tour_id'),
        hotel_id=data.get('hotel_id'),
        rating=int(data['rating']),
        comment=sanitize_input(data.get('comment', ''), max_length=2000),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify({'message': 'Review submitted', 'review': review.to_dict()}), 201

@reviews_bp.route('/<review_id>', methods=['DELETE'])
@token_required
def delete_review(current_user, review_id):
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    if review.user_id != current_user['user_id'] and current_user['role'] != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'Review deleted'}), 200
