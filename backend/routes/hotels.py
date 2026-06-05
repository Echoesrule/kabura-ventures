import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from models.hotel import Hotel, HotelImage
from models import db
from middleware.auth import admin_required
from utils.helpers import validate_required_fields, sanitize_input, allowed_file, validate_length, validate_number

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

@hotels_bp.route('/<hotel_id>', methods=['GET'])
def get_hotel(hotel_id):
    hotel = Hotel.query.get(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404
    return jsonify({'hotel': hotel.to_dict()}), 200

@hotels_bp.route('', methods=['POST'])
@admin_required
def create_hotel(current_user):
    data = request.form if request.form else request.get_json()
    missing = validate_required_fields(data, ['name', 'price_per_night'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

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
        return jsonify({'error': '. '.join(errors)}), 400

    hotel = Hotel(
        name=name,
        description=description,
        location=location,
        price_per_night=float(data.get('price_per_night', 0)),
        rating=float(data.get('rating', 0)),
        amenities=amenities,
        available=True
    )
    db.session.add(hotel)
    db.session.flush()

    if request.files:
        files = request.files.getlist('images')
        is_first = True
        for file in files:
            if file and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4()}.{ext}"
                upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(upload_path)

                hotel_image = HotelImage(
                    hotel_id=hotel.id,
                    image_url=f'/assets/images/{filename}',
                    is_primary=is_first
                )
                db.session.add(hotel_image)
                is_first = False

    db.session.commit()
    return jsonify({'message': 'Hotel created', 'hotel': hotel.to_dict()}), 201

@hotels_bp.route('/<hotel_id>', methods=['PUT', 'POST'])
@admin_required
def update_hotel(current_user, hotel_id):
    hotel = Hotel.query.get(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404

    data = request.form if request.form else request.get_json()
    errors = []
    if 'name' in data:
        hotel.name = sanitize_input(data['name'], max_length=255)
        err = validate_length(hotel.name, 255, 'Name')
        if err: errors.append(err)
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
    if errors:
        return jsonify({'error': '. '.join(errors)}), 400
    if 'available' in data:
        hotel.available = data['available'] == 'true' or data['available'] is True

    if request.files:
        files = request.files.getlist('images')
        for i, file in enumerate(files):
            if file and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4()}.{ext}"
                upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(upload_path)

                hotel_image = HotelImage(
                    hotel_id=hotel.id,
                    image_url=f'/assets/images/{filename}',
                    is_primary=i == 0
                )
                if i == 0:
                    HotelImage.query.filter_by(hotel_id=hotel.id).update({'is_primary': False})
                db.session.add(hotel_image)

    db.session.commit()
    return jsonify({'message': 'Hotel updated', 'hotel': hotel.to_dict()}), 200

@hotels_bp.route('/<hotel_id>', methods=['DELETE'])
@admin_required
def delete_hotel(current_user, hotel_id):
    hotel = Hotel.query.get(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404
    db.session.delete(hotel)
    db.session.commit()
    return jsonify({'message': 'Hotel deleted'}), 200

@hotels_bp.route('/images/<image_id>', methods=['DELETE'])
@admin_required
def delete_hotel_image(current_user, image_id):
    image = HotelImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    db.session.delete(image)
    db.session.commit()
    return jsonify({'message': 'Image deleted'}), 200

@hotels_bp.route('/images/<image_id>/primary', methods=['PUT'])
@admin_required
def set_hotel_primary_image(current_user, image_id):
    image = HotelImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    HotelImage.query.filter_by(hotel_id=image.hotel_id).update({'is_primary': False})
    image.is_primary = True
    db.session.commit()
    return jsonify({'message': 'Primary image updated'}), 200
