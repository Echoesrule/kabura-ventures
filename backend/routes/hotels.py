from flask import Blueprint, request, jsonify
from models.hotel import Hotel
from models import db

hotels_bp = Blueprint('hotels', __name__, url_prefix='/api/hotels')

@hotels_bp.route('', methods=['GET'])
def get_hotels():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    location = request.args.get('location')

    query = Hotel.query
    if location:
        query = query.filter(Hotel.location.ilike(f'%{location}%'))

    query = query.order_by(Hotel.created_at.desc())
    hotels = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'hotels': [hotel.to_dict() for hotel in hotels.items],
        'total': hotels.total,
        'page': hotels.page,
        'per_page': hotels.per_page,
        'pages': hotels.pages
    }), 200

@hotels_bp.route('/<identifier>', methods=['GET'])
def get_hotel(identifier):
    hotel = Hotel.query.filter_by(slug=identifier).first()
    if not hotel:
        hotel = Hotel.query.get(identifier)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404
    return jsonify({'hotel': hotel.to_dict()}), 200
