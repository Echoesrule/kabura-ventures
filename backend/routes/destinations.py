import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from models.destination import Destination
from models import db
from middleware.auth import admin_required
from services.storage import save_image, delete_image
from utils.helpers import validate_required_fields, sanitize_input, allowed_file

destinations_bp = Blueprint('destinations', __name__, url_prefix='/api/destinations')

@destinations_bp.route('', methods=['GET'])
def get_destinations():
    destinations = Destination.query.order_by(Destination.sort_order.asc(), Destination.name.asc()).all()
    return jsonify({'destinations': [d.to_dict() for d in destinations]}), 200

@destinations_bp.route('', methods=['POST'])
@admin_required
def create_destination(current_user):
    data = request.form if request.form else request.get_json()
    missing = validate_required_fields(data, ['name'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    name = sanitize_input(data.get('name', ''), max_length=255)
    sort_order = data.get('sort_order', 0, type=int)

    image_url = data.get('image_url', '')
    if request.files and 'image' in request.files:
        file = request.files['image']
        if file.filename and allowed_file(file.filename):
            image_url = save_image(file, 'destinations')

    dest = Destination(name=name, image_url=image_url, sort_order=sort_order)
    db.session.add(dest)
    db.session.commit()

    return jsonify({'message': 'Destination created', 'destination': dest.to_dict()}), 201

@destinations_bp.route('/<dest_id>', methods=['PUT'])
@admin_required
def update_destination(current_user, dest_id):
    dest = Destination.query.get(dest_id)
    if not dest:
        return jsonify({'error': 'Destination not found'}), 404

    data = request.form if request.form else request.get_json()

    if 'name' in data:
        dest.name = sanitize_input(data['name'], max_length=255)
    if 'sort_order' in data:
        dest.sort_order = int(data['sort_order'])
    if 'image_url' in data and data['image_url']:
        dest.image_url = data['image_url']

    if request.files and 'image' in request.files:
        file = request.files['image']
        if file.filename and allowed_file(file.filename):
            image_url = save_image(file, 'destinations')
            if image_url:
                if dest.image_url and '/assets/images/' in dest.image_url:
                    delete_image(dest.image_url)
                dest.image_url = image_url

    db.session.commit()
    return jsonify({'message': 'Destination updated', 'destination': dest.to_dict()}), 200

@destinations_bp.route('/<dest_id>', methods=['DELETE'])
@admin_required
def delete_destination(current_user, dest_id):
    dest = Destination.query.get(dest_id)
    if not dest:
        return jsonify({'error': 'Destination not found'}), 404
    if dest.image_url and '/assets/images/' in dest.image_url:
        delete_image(dest.image_url)
    db.session.delete(dest)
    db.session.commit()
    return jsonify({'message': 'Destination deleted'}), 200
