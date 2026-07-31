from models.testimonial import Testimonial
from models import db
from utils.helpers import validate_required_fields, sanitize_input, clamp_number
from services.base import ServiceError


def get_all_testimonials():
    testimonials = Testimonial.query.order_by(Testimonial.sort_order.asc()).all()
    return [t.to_dict() for t in testimonials]


def create_testimonial(data):
    missing = validate_required_fields(data, ['name', 'text'])
    if missing:
        raise ServiceError(f'Missing fields: {", ".join(missing)}')

    testimonial = Testimonial(
        name=sanitize_input(data.get('name', ''), max_length=100),
        location=sanitize_input(data.get('location', ''), max_length=100),
        text=sanitize_input(data.get('text', ''), max_length=2000),
        rating=int(clamp_number(data.get('rating', 5), min_val=1, max_val=5)),
        sort_order=int(clamp_number(data.get('sort_order', 0), min_val=0, max_val=99999)),
    )
    db.session.add(testimonial)
    db.session.commit()
    return testimonial.to_dict(), 201


def update_testimonial(testimonial, data):
    if 'name' in data: testimonial.name = sanitize_input(data['name'], max_length=100)
    if 'location' in data: testimonial.location = sanitize_input(data['location'], max_length=100)
    if 'text' in data: testimonial.text = sanitize_input(data['text'], max_length=2000)
    if 'rating' in data: testimonial.rating = int(clamp_number(data['rating'], min_val=1, max_val=5))
    if 'sort_order' in data: testimonial.sort_order = int(clamp_number(data['sort_order'], min_val=0, max_val=99999))
    if 'is_active' in data: testimonial.is_active = data['is_active'] in (True, 'true', '1', 1)
    db.session.commit()
    return testimonial.to_dict(), 200


def delete_testimonial(testimonial):
    db.session.delete(testimonial)
    db.session.commit()
