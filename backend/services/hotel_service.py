from models.hotel import Hotel, HotelImage, slugify
from models import db
from services.storage import save_image, delete_image
from utils.helpers import validate_required_fields, sanitize_input, validate_length, validate_number
from services.base import ServiceError


def create_hotel(data, files=None):
    missing = validate_required_fields(data, ['name', 'price_per_night'])
    if missing:
        raise ServiceError(f'Missing fields: {", ".join(missing)}')

    name = sanitize_input(data.get('name', ''), max_length=255)
    description = sanitize_input(data.get('description', ''), max_length=5000)
    location = sanitize_input(data.get('location', ''), max_length=255)
    amenities = sanitize_input(data.get('amenities', ''), max_length=2000)

    errors = []
    for label, val in [('Name', name), ('Location', location)]:
        err = validate_length(val, 255, label)
        if err: errors.append(err)
    desc_err = validate_length(description, 5000, 'Description')
    if desc_err: errors.append(desc_err)
    amen_err = validate_length(amenities, 2000, 'Amenities')
    if amen_err: errors.append(amen_err)
    price_err = validate_number(data.get('price_per_night', 0), min_val=0, field_name='Price per night')
    if price_err: errors.append(price_err)
    rating_err = validate_number(data.get('rating', 0), min_val=0, max_val=5, field_name='Rating')
    if rating_err: errors.append(rating_err)
    if errors:
        raise ServiceError('. '.join(errors))

    base_slug = slugify(name)
    slug = base_slug
    counter = 1
    while Hotel.query.filter_by(slug=slug).first():
        slug = f'{base_slug}-{counter}'
        counter += 1

    hotel = Hotel(
        slug=slug, name=name, description=description, location=location,
        location_name=sanitize_input(data.get('location_name', ''), max_length=255),
        formatted_address=sanitize_input(data.get('formatted_address', ''), max_length=500),
        county=sanitize_input(data.get('county', ''), max_length=100),
        country=sanitize_input(data.get('country', ''), max_length=100),
        place_id=sanitize_input(data.get('place_id', ''), max_length=255),
        latitude=float(data['latitude']) if data.get('latitude') else None,
        longitude=float(data['longitude']) if data.get('longitude') else None,
        price_per_night=float(data.get('price_per_night', 0)),
        rating=float(data.get('rating', 0)), amenities=amenities, available=True
    )
    db.session.add(hotel)
    db.session.flush()

    if files:
        is_first = True
        for file in files:
            image_url = save_image(file, 'hotels')
            if image_url:
                db.session.add(HotelImage(hotel_id=hotel.id, image_url=image_url, is_primary=is_first))
                is_first = False

    db.session.commit()
    return hotel.to_dict(), 201


def update_hotel(hotel, data, files=None):
    errors = []
    if 'name' in data:
        hotel.name = sanitize_input(data['name'], max_length=255)
        err = validate_length(hotel.name, 255, 'Name')
        if err: errors.append(err)
        base_slug = slugify(hotel.name)
        slug = base_slug
        counter = 1
        while Hotel.query.filter(Hotel.slug == slug, Hotel.id != hotel.id).first():
            slug = f'{base_slug}-{counter}'
            counter += 1
        hotel.slug = slug
    if 'description' in data:
        hotel.description = sanitize_input(data['description'], max_length=5000)
        err = validate_length(hotel.description, 5000, 'Description')
        if err: errors.append(err)
    if 'location' in data:
        hotel.location = sanitize_input(data['location'], max_length=255)
        err = validate_length(hotel.location, 255, 'Location')
        if err: errors.append(err)
    if 'price_per_night' in data:
        err = validate_number(data['price_per_night'], min_val=0, field_name='Price per night')
        if err: errors.append(err)
        hotel.price_per_night = float(data['price_per_night'])
    if 'rating' in data:
        err = validate_number(data['rating'], min_val=0, max_val=5, field_name='Rating')
        if err: errors.append(err)
        hotel.rating = float(data['rating'])
    if 'amenities' in data:
        hotel.amenities = sanitize_input(data['amenities'], max_length=2000)
        err = validate_length(hotel.amenities, 2000, 'Amenities')
        if err: errors.append(err)
    for field in ('location_name', 'formatted_address', 'county', 'country', 'place_id'):
        if field in data:
            setattr(hotel, field, sanitize_input(data[field], max_length=255))
    if 'latitude' in data:
        hotel.latitude = float(data['latitude']) if data['latitude'] else None
    if 'longitude' in data:
        hotel.longitude = float(data['longitude']) if data['longitude'] else None
    if errors:
        raise ServiceError('. '.join(errors))
    if 'available' in data:
        hotel.available = data['available'] == 'true' or data['available'] is True

    if files:
        for i, file in enumerate(files):
            image_url = save_image(file, 'hotels')
            if image_url:
                if i == 0:
                    HotelImage.query.filter_by(hotel_id=hotel.id).update({'is_primary': False})
                db.session.add(HotelImage(hotel_id=hotel.id, image_url=image_url, is_primary=i == 0))

    db.session.commit()
    return hotel.to_dict(), 200


def delete_hotel(hotel):
    db.session.delete(hotel)
    db.session.commit()


def delete_hotel_image(image):
    delete_image(image.image_url)
    db.session.delete(image)
    db.session.commit()


def set_hotel_primary_image(image):
    HotelImage.query.filter_by(hotel_id=image.hotel_id).update({'is_primary': False})
    image.is_primary = True
    db.session.commit()
