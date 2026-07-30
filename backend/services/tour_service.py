from models.tour import Tour, TourImage, slugify
from models.activity_type import ActivityType
from models import db
from services.storage import save_image, delete_image
from utils.helpers import validate_required_fields, sanitize_input, validate_length, validate_number
from services.base import ServiceError


def create_tour(data, files=None):
    missing = validate_required_fields(data, ['title', 'price', 'duration_days'])
    if missing:
        raise ServiceError(f'Missing fields: {", ".join(missing)}')

    title = sanitize_input(data.get('title', ''), max_length=255)
    description = sanitize_input(data.get('description', ''), max_length=5000)
    location = sanitize_input(data.get('location', ''), max_length=255)
    wildlife = sanitize_input(data.get('wildlife', ''), max_length=1000)

    errors = []
    for label, val in [('Title', title), ('Location', location)]:
        err = validate_length(val, 255, label)
        if err: errors.append(err)
    desc_err = validate_length(description, 5000, 'Description')
    if desc_err: errors.append(desc_err)
    dur_err = validate_number(data.get('duration_days', 1), min_val=1, max_val=365, field_name='Duration days')
    if dur_err: errors.append(dur_err)
    price_err = validate_number(data.get('price', 0), min_val=0, field_name='Price')
    if price_err: errors.append(price_err)
    if errors:
        raise ServiceError('. '.join(errors))

    base_slug = slugify(title)
    slug = base_slug
    counter = 1
    while Tour.query.filter_by(slug=slug).first():
        slug = f'{base_slug}-{counter}'
        counter += 1

    activity_type = sanitize_input(data.get('activity_type', ''), max_length=100).lower() or None

    tour = Tour(
        slug=slug, title=title, description=description,
        price=float(data.get('price', 0)), duration_days=int(data.get('duration_days', 1)),
        activity_type=activity_type, location=location,
        location_name=sanitize_input(data.get('location_name', ''), max_length=255) or None,
        formatted_address=sanitize_input(data.get('formatted_address', ''), max_length=500) or None,
        county=sanitize_input(data.get('county', ''), max_length=100) or None,
        country=sanitize_input(data.get('country', ''), max_length=100) or None,
        place_id=data.get('place_id') or None,
        meeting_point_name=sanitize_input(data.get('meeting_point_name', ''), max_length=255) or None,
        meeting_address=sanitize_input(data.get('meeting_address', ''), max_length=500) or None,
        meeting_latitude=float(data['meeting_latitude']) if data.get('meeting_latitude') else None,
        meeting_longitude=float(data['meeting_longitude']) if data.get('meeting_longitude') else None,
        meeting_place_id=data.get('meeting_place_id') or None,
        max_people=int(data.get('max_people', 20)), featured=data.get('featured', 'false').lower() == 'true',
        wildlife=wildlife, latitude=float(data['latitude']) if data.get('latitude') else None,
        longitude=float(data['longitude']) if data.get('longitude') else None,
        original_price=float(data['original_price']) if data.get('original_price') else None,
        discount_pct=int(data['discount_pct']) if data.get('discount_pct') else None,
        itinerary=data.get('itinerary') if data.get('itinerary') else None, available=True
    )
    db.session.add(tour)
    db.session.flush()

    if files:
        is_first = True
        for file in files:
            image_url = save_image(file, 'tours')
            if image_url:
                db.session.add(TourImage(tour_id=tour.id, image_url=image_url, is_primary=is_first))
                is_first = False

    db.session.commit()
    return tour.to_dict(), 201


def update_tour(tour, data, files=None):
    errors = []
    if 'title' in data:
        tour.title = sanitize_input(data['title'], max_length=255)
        err = validate_length(tour.title, 255, 'Title')
        if err: errors.append(err)
        base_slug = slugify(tour.title)
        slug = base_slug
        counter = 1
        while Tour.query.filter(Tour.slug == slug, Tour.id != tour.id).first():
            slug = f'{base_slug}-{counter}'
            counter += 1
        tour.slug = slug
    if 'description' in data:
        tour.description = sanitize_input(data['description'], max_length=5000)
        err = validate_length(tour.description, 5000, 'Description')
        if err: errors.append(err)
    if 'price' in data:
        err = validate_number(data['price'], min_val=0, field_name='Price')
        if err: errors.append(err)
        tour.price = float(data['price'])
    if 'duration_days' in data:
        err = validate_number(data['duration_days'], min_val=1, max_val=365, field_name='Duration days')
        if err: errors.append(err)
        tour.duration_days = int(data['duration_days'])
    if 'location' in data:
        tour.location = sanitize_input(data['location'], max_length=255)
        err = validate_length(tour.location, 255, 'Location')
        if err: errors.append(err)
    if 'location_name' in data:
        tour.location_name = sanitize_input(data['location_name'], max_length=255) or None
    if 'formatted_address' in data:
        tour.formatted_address = sanitize_input(data['formatted_address'], max_length=500) or None
    if 'county' in data:
        tour.county = sanitize_input(data['county'], max_length=100) or None
    if 'country' in data:
        tour.country = sanitize_input(data['country'], max_length=100) or None
    if 'place_id' in data:
        tour.place_id = data['place_id'] or None
    if 'meeting_point_name' in data:
        tour.meeting_point_name = sanitize_input(data['meeting_point_name'], max_length=255) or None
    if 'meeting_address' in data:
        tour.meeting_address = sanitize_input(data['meeting_address'], max_length=500) or None
    if 'meeting_latitude' in data:
        tour.meeting_latitude = float(data['meeting_latitude']) if data['meeting_latitude'] else None
    if 'meeting_longitude' in data:
        tour.meeting_longitude = float(data['meeting_longitude']) if data['meeting_longitude'] else None
    if 'meeting_place_id' in data:
        tour.meeting_place_id = data['meeting_place_id'] or None
    if 'max_people' in data:
        err = validate_number(data['max_people'], min_val=1, max_val=1000, field_name='Max people')
        if err: errors.append(err)
        tour.max_people = int(data['max_people'])
    if 'wildlife' in data:
        tour.wildlife = sanitize_input(data['wildlife'], max_length=1000)
    if 'latitude' in data:
        tour.latitude = float(data['latitude']) if data['latitude'] else None
    if 'longitude' in data:
        tour.longitude = float(data['longitude']) if data['longitude'] else None
    if errors:
        raise ServiceError('. '.join(errors))
    if 'featured' in data:
        tour.featured = data['featured'] == 'true' or data['featured'] is True
    if 'available' in data:
        tour.available = data['available'] == 'true' or data['available'] is True
    if 'original_price' in data:
        tour.original_price = float(data['original_price']) if data['original_price'] else None
    if 'discount_pct' in data:
        tour.discount_pct = int(data['discount_pct']) if data['discount_pct'] else None
    if 'activity_type' in data:
        tour.activity_type = sanitize_input(data['activity_type'], max_length=100).lower() or None
    if 'itinerary' in data:
        tour.itinerary = data['itinerary'] if data['itinerary'] else None

    if files:
        for i, file in enumerate(files):
            image_url = save_image(file, 'tours')
            if image_url:
                if i == 0:
                    TourImage.query.filter_by(tour_id=tour.id).update({'is_primary': False})
                db.session.add(TourImage(tour_id=tour.id, image_url=image_url, is_primary=i == 0))

    db.session.commit()
    return tour.to_dict(), 200


def delete_tour(tour):
    db.session.delete(tour)
    db.session.commit()


def delete_tour_image(image):
    delete_image(image.image_url)
    db.session.delete(image)
    db.session.commit()


def set_tour_primary_image(image):
    TourImage.query.filter_by(tour_id=image.tour_id).update({'is_primary': False})
    image.is_primary = True
    db.session.commit()


def create_activity_type(name):
    name = name.strip().lower()
    if not name:
        raise ServiceError('Type name is required')
    existing = ActivityType.query.filter_by(name=name).first()
    if existing:
        raise ServiceError('Type already exists', 409)
    t = ActivityType(name=name)
    db.session.add(t)
    db.session.commit()
    return t.to_dict(), 201


def delete_activity_type(name):
    from urllib.parse import unquote
    name = unquote(name).strip().lower()
    t = ActivityType.query.filter_by(name=name).first()
    if not t:
        raise ServiceError('Type not found', 404)
    Tour.query.filter(Tour.activity_type == name).update({'activity_type': None})
    db.session.delete(t)
    db.session.commit()
