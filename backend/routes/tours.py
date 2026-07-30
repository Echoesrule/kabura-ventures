from flask import Blueprint, request, jsonify
from models.tour import Tour, TourImage
from models.review import Review
from models.activity_type import ActivityType
from models import db

tours_bp = Blueprint('tours', __name__, url_prefix='/api/tours')

@tours_bp.route('', methods=['GET'])
def get_tours():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    featured = request.args.get('featured', type=bool)
    location = request.args.get('location')
    activity_type = request.args.get('activity_type')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    min_duration = request.args.get('min_duration', type=int)
    max_duration = request.args.get('max_duration', type=int)
    search = request.args.get('search')

    query = Tour.query

    if featured is not None:
        query = query.filter_by(featured=featured)
    if location:
        query = query.filter(Tour.location.ilike(f'%{location}%'))
    if activity_type:
        query = query.filter(Tour.activity_type == activity_type)
    if min_price is not None:
        query = query.filter(Tour.price >= min_price)
    if max_price is not None:
        query = query.filter(Tour.price <= max_price)
    if min_duration is not None:
        query = query.filter(Tour.duration_days >= min_duration)
    if max_duration is not None:
        query = query.filter(Tour.duration_days <= max_duration)
    if search:
        like = f'%{search}%'
        query = query.filter(
            db.or_(Tour.title.ilike(like), Tour.description.ilike(like), Tour.location.ilike(like))
        )

    query = query.order_by(Tour.created_at.desc())
    tours = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'tours': [tour.to_dict() for tour in tours.items],
        'total': tours.total,
        'page': tours.page,
        'per_page': tours.per_page,
        'pages': tours.pages
    }), 200

@tours_bp.route('/locations', methods=['GET'])
def get_tour_locations():
    tours = Tour.query.filter(
        Tour.latitude.isnot(None),
        Tour.longitude.isnot(None),
        Tour.available == True
    ).all()
    return jsonify({'tours': [{
        'id': t.id,
        'slug': t.slug,
        'title': t.title,
        'price': float(t.price) if t.price else 0,
        'duration_days': t.duration_days,
        'location': t.location,
        'latitude': t.latitude,
        'longitude': t.longitude,
        'images': [img.to_dict() for img in t.images.all()],
        'avg_rating': float(db.session.query(db.func.avg(Review.rating)).filter(Review.tour_id == t.id).scalar() or 0)
    } for t in tours]}), 200

@tours_bp.route('/<identifier>', methods=['GET'])
def get_tour(identifier):
    tour = Tour.query.filter_by(slug=identifier).first()
    if not tour:
        tour = Tour.query.get(identifier)
    if not tour:
        return jsonify({'error': 'Tour not found'}), 404
    return jsonify({'tour': tour.to_dict()}), 200

@tours_bp.route('/<tour_id>/related', methods=['GET'])
def get_related_tours(tour_id):
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({'error': 'Tour not found'}), 404
    related = Tour.query.filter(
        Tour.id != tour_id,
        db.or_(Tour.activity_type == tour.activity_type, Tour.location == tour.location),
        Tour.available == True
    ).limit(4).all()
    return jsonify({'tours': [t.to_brief() for t in related]}), 200

@tours_bp.route('/activity-types', methods=['GET'])
def get_activity_types():
    types = ActivityType.query.order_by(ActivityType.name).all()
    return jsonify({'types': [t.name for t in types]}), 200
