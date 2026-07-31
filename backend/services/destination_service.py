from models.destination import Destination
from models import db
from services.storage import save_image
from utils.helpers import validate_required_fields, sanitize_input, allowed_file, clamp_number
from services.base import ServiceError


def get_all_destinations():
    destinations = Destination.query.order_by(Destination.sort_order.asc()).all()
    return [d.to_dict() for d in destinations]


def create_destination(data, files=None):
    missing = validate_required_fields(data, ['name'])
    if missing:
        raise ServiceError(f'Missing fields: {", ".join(missing)}')

    name = sanitize_input(data.get('name', ''), max_length=255)
    dest = Destination(
        name=name,
        location_text=sanitize_input(data.get('location_text', ''), max_length=255),
        description=sanitize_input(data.get('description', ''), max_length=1000),
        link_url=sanitize_input(data.get('link_url', ''), max_length=500),
        latitude=clamp_number(data.get('latitude'), min_val=-90, max_val=90) if data.get('latitude') else None,
        longitude=clamp_number(data.get('longitude'), min_val=-180, max_val=180) if data.get('longitude') else None,
        sort_order=int(clamp_number(data.get('sort_order', 0), min_val=0, max_val=99999)),
    )
    if files and files.get('image') and allowed_file(files['image'].filename):
        dest.image_url = save_image(files['image'], 'destinations')
    db.session.add(dest)
    db.session.commit()
    return dest.to_dict(), 201


def update_destination(dest, data, files=None):
    if 'name' in data: dest.name = sanitize_input(data['name'], max_length=255)
    if 'location_text' in data: dest.location_text = sanitize_input(data['location_text'], max_length=255)
    if 'description' in data: dest.description = sanitize_input(data['description'], max_length=1000)
    if 'link_url' in data: dest.link_url = sanitize_input(data['link_url'], max_length=500)
    if 'latitude' in data: dest.latitude = clamp_number(data['latitude'], min_val=-90, max_val=90) if data['latitude'] else None
    if 'longitude' in data: dest.longitude = clamp_number(data['longitude'], min_val=-180, max_val=180) if data['longitude'] else None
    if 'sort_order' in data: dest.sort_order = int(clamp_number(data['sort_order'], min_val=0, max_val=99999))
    if 'is_active' in data: dest.is_active = data['is_active'] in (True, 'true', '1', 1)
    if files and files.get('image') and allowed_file(files['image'].filename):
        dest.image_url = save_image(files['image'], 'destinations')
    db.session.commit()
    return dest.to_dict(), 200


def delete_destination(dest):
    db.session.delete(dest)
    db.session.commit()
