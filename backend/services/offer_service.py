from models.offer_service import OfferService
from models import db
from services.storage import save_image, delete_image
from utils.helpers import validate_required_fields, sanitize_input, allowed_file
from services.base import ServiceError


def get_all_offers():
    offers = OfferService.query.order_by(OfferService.sort_order.asc()).all()
    return [o.to_dict() for o in offers]


def create_offer(data, files=None):
    missing = validate_required_fields(data, ['title'])
    if missing:
        raise ServiceError(f'Missing fields: {", ".join(missing)}')

    title = sanitize_input(data.get('title', ''), max_length=255)
    description = sanitize_input(data.get('description', ''), max_length=1000)
    link_url = sanitize_input(data.get('link_url', ''), max_length=500)
    sort_order = int(data.get('sort_order', 0))
    image_url = sanitize_input(data.get('image_url', ''), max_length=500)

    if files and files.get('image') and files['image'].filename and allowed_file(files['image'].filename):
        image_url = save_image(files['image'], 'offers')

    offer = OfferService(title=title, description=description, image_url=image_url, link_url=link_url, sort_order=sort_order)
    db.session.add(offer)
    db.session.commit()
    return offer.to_dict(), 201


def update_offer(offer, data, files=None):
    if 'title' in data: offer.title = sanitize_input(data['title'], max_length=255)
    if 'description' in data: offer.description = sanitize_input(data['description'], max_length=1000)
    if 'link_url' in data: offer.link_url = sanitize_input(data['link_url'], max_length=500)
    if 'sort_order' in data: offer.sort_order = int(data['sort_order'])
    if 'is_active' in data: offer.is_active = data['is_active'] in (True, 'true', '1', 1)
    if 'image_url' in data and data['image_url']:
        offer.image_url = sanitize_input(data['image_url'], max_length=500)

    if files and files.get('image') and files['image'].filename and allowed_file(files['image'].filename):
        image_url = save_image(files['image'], 'offers')
        if image_url:
            if offer.image_url and '/assets/images/' in offer.image_url:
                delete_image(offer.image_url)
            offer.image_url = image_url

    db.session.commit()
    return offer.to_dict(), 200


def delete_offer(offer):
    if offer.image_url and '/assets/images/' in offer.image_url:
        delete_image(offer.image_url)
    db.session.delete(offer)
    db.session.commit()
