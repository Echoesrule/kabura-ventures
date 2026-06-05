import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models.tour import Tour, TourImage
from models.review import Review
from models import db
from middleware.auth import admin_required, token_required
from utils.helpers import validate_required_fields, sanitize_input, allowed_file, validate_length, validate_number

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

@tours_bp.route('/<tour_id>', methods=['GET'])
def get_tour(tour_id):
    tour = Tour.query.get(tour_id)
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
    types = db.session.query(Tour.activity_type).distinct().all()
    return jsonify({'types': [t[0] for t in types if t[0]]}), 200

@tours_bp.route('', methods=['POST'])
@admin_required
def create_tour(current_user):
    data = request.form if request.form else request.get_json()
    missing = validate_required_fields(data, ['title', 'price', 'duration_days'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    title = sanitize_input(data.get('title', ''), max_length=255)
    description = sanitize_input(data.get('description', ''), max_length=5000)
    location = sanitize_input(data.get('location', ''), max_length=255)

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
        return jsonify({'error': '. '.join(errors)}), 400

    tour = Tour(
        title=title,
        description=description,
        price=float(data.get('price', 0)),
        duration_days=int(data.get('duration_days', 1)),
        location=location,
        max_people=int(data.get('max_people', 20)),
        featured=data.get('featured', 'false').lower() == 'true',
        available=True
    )
    db.session.add(tour)
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

                tour_image = TourImage(
                    tour_id=tour.id,
                    image_url=f'/assets/images/{filename}',
                    is_primary=is_first
                )
                db.session.add(tour_image)
                is_first = False

    db.session.commit()
    return jsonify({'message': 'Tour created', 'tour': tour.to_dict()}), 201

@tours_bp.route('/<tour_id>', methods=['PUT', 'POST'])
@admin_required
def update_tour(current_user, tour_id):
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({'error': 'Tour not found'}), 404

    data = request.form if request.form else request.get_json()
    errors = []
    if 'title' in data:
        tour.title = sanitize_input(data['title'], max_length=255)
        err = validate_length(tour.title, 255, 'Title')
        if err: errors.append(err)
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
    if 'max_people' in data:
        err = validate_number(data['max_people'], min_val=1, max_val=1000, field_name='Max people')
        if err: errors.append(err)
        tour.max_people = int(data['max_people'])
    if errors:
        return jsonify({'error': '. '.join(errors)}), 400
    if 'featured' in data:
        tour.featured = data['featured'] == 'true' or data['featured'] is True
    if 'available' in data:
        tour.available = data['available'] == 'true' or data['available'] is True

    if request.files:
        files = request.files.getlist('images')
        for i, file in enumerate(files):
            if file and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4()}.{ext}"
                upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(upload_path)

                tour_image = TourImage(
                    tour_id=tour.id,
                    image_url=f'/assets/images/{filename}',
                    is_primary=i == 0
                )
                if i == 0:
                    TourImage.query.filter_by(tour_id=tour.id).update({'is_primary': False})
                db.session.add(tour_image)

    db.session.commit()
    return jsonify({'message': 'Tour updated', 'tour': tour.to_dict()}), 200

@tours_bp.route('/<tour_id>', methods=['DELETE'])
@admin_required
def delete_tour(current_user, tour_id):
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({'error': 'Tour not found'}), 404

    db.session.delete(tour)
    db.session.commit()
    return jsonify({'message': 'Tour deleted'}), 200

@tours_bp.route('/images/<image_id>', methods=['DELETE'])
@admin_required
def delete_tour_image(current_user, image_id):
    image = TourImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    db.session.delete(image)
    db.session.commit()
    return jsonify({'message': 'Image deleted'}), 200

@tours_bp.route('/images/<image_id>/primary', methods=['PUT'])
@admin_required
def set_tour_primary_image(current_user, image_id):
    image = TourImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    TourImage.query.filter_by(tour_id=image.tour_id).update({'is_primary': False})
    image.is_primary = True
    db.session.commit()
    return jsonify({'message': 'Primary image updated'}), 200
