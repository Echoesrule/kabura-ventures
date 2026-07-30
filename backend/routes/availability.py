from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models.availability import TourAvailability
from models.tour import Tour
from models import db

availability_bp = Blueprint('availability', __name__, url_prefix='/api/availability')

@availability_bp.route('/<tour_id>', methods=['GET'])
def get_availability(tour_id):
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({'error': 'Tour not found'}), 404

    month = request.args.get('month')
    year = request.args.get('year')

    query = TourAvailability.query.filter_by(tour_id=tour_id)
    if month and year:
        query = query.filter(
            db.extract('month', TourAvailability.date) == int(month),
            db.extract('year', TourAvailability.date) == int(year)
        )
    availabilities = query.order_by(TourAvailability.date).all()

    if not availabilities:
        availabilities = []
        start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        for i in range(60):
            day = start + timedelta(days=i)
            availabilities.append(TourAvailability(
                tour_id=tour_id,
                date=day,
                available_slots=tour.max_people,
                max_people=tour.max_people
            ))

    return jsonify({
        'availabilities': [a.to_dict() for a in availabilities],
        'max_people': tour.max_people
    }), 200
