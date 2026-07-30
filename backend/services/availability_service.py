from datetime import datetime, timedelta
from models.availability import TourAvailability
from models.tour import Tour
from models import db
from services.base import ServiceError


def generate_availability(tour, months=3, slots=None):
    if slots is None:
        slots = tour.max_people
    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    count = 0
    for i in range(30 * months):
        day = start + timedelta(days=i)
        existing = TourAvailability.query.filter_by(tour_id=tour.id, date=day).first()
        if not existing:
            a = TourAvailability(tour_id=tour.id, date=day, available_slots=slots, max_people=slots)
            db.session.add(a)
            count += 1
    db.session.commit()
    return count
