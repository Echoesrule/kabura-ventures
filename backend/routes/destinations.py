import os
import uuid
import requests
from flask import Blueprint, request, jsonify, current_app
from models.destination import Destination
from models import db
from middleware.auth import admin_required
from services.storage import save_image, delete_image
from utils.helpers import validate_required_fields, sanitize_input, allowed_file

destinations_bp = Blueprint('destinations', __name__, url_prefix='/api/destinations')

def geocode_location(query):
    if not query:
        return None, None
    try:
        url = 'https://nominatim.openstreetmap.org/search'
        params = {'q': query, 'format': 'json', 'limit': 1}
        headers = {'User-Agent': 'KaburaAdventures/1.0'}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f'Geocoding error for "{query}": {e}')
    return None, None

@destinations_bp.route('', methods=['GET'])
def get_destinations():
    destinations = Destination.query.filter_by(is_active=True).order_by(Destination.sort_order.asc(), Destination.name.asc()).all()
    return jsonify({'destinations': [d.to_dict() for d in destinations]}), 200

@destinations_bp.route('/all', methods=['GET'])
@admin_required
def get_all_destinations(current_user):
    destinations = Destination.query.order_by(Destination.sort_order.asc(), Destination.name.asc()).all()
    return jsonify({'destinations': [d.to_dict() for d in destinations]}), 200

@destinations_bp.route('/geocode', methods=['GET'])
def geocode():
    q = request.args.get('q', '')
    if not q:
        return jsonify({'error': 'Missing query parameter "q"'}), 400
    lat, lng = geocode_location(q)
    if lat is not None:
        return jsonify({'lat': lat, 'lng': lng, 'query': q}), 200
    return jsonify({'error': 'Could not geocode location', 'query': q}), 404

@destinations_bp.route('/geocode/autocomplete', methods=['GET'])
def geocode_autocomplete():
    q = request.args.get('q', '')
    if not q or len(q) < 2:
        return jsonify({'results': []}), 200
    try:
        url = 'https://nominatim.openstreetmap.org/search'
        params = {'q': q, 'format': 'json', 'limit': 6, 'addressdetails': 1}
        headers = {'User-Agent': 'KaburaAdventures/1.0'}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            results = []
            for item in data:
                addr = item.get('address', {})
                results.append({
                    'display_name': item.get('display_name', ''),
                    'lat': float(item['lat']),
                    'lon': float(item['lon']),
                    'place_id': item.get('place_id'),
                    'osm_type': item.get('osm_type'),
                    'osm_id': item.get('osm_id'),
                    'type': item.get('type'),
                    'category': item.get('category'),
                    'county': addr.get('county') or addr.get('state_district') or '',
                    'state': addr.get('state') or '',
                    'country': addr.get('country') or '',
                    'country_code': addr.get('country_code') or '',
                    'city': addr.get('city') or addr.get('town') or addr.get('village') or '',
                })
            return jsonify({'results': results}), 200
    except Exception as e:
        print(f'Geocoding autocomplete error: {e}')
    return jsonify({'results': []}), 200

@destinations_bp.route('/geocode/reverse', methods=['GET'])
def reverse_geocode():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({'error': 'Missing lat/lon parameters'}), 400
    try:
        url = 'https://nominatim.openstreetmap.org/reverse'
        params = {'lat': lat, 'lon': lon, 'format': 'json', 'addressdetails': 1}
        headers = {'User-Agent': 'KaburaAdventures/1.0'}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            addr = data.get('address', {})
            return jsonify({
                'display_name': data.get('display_name', ''),
                'lat': float(data['lat']),
                'lon': float(data['lon']),
                'place_id': data.get('place_id'),
                'osm_type': data.get('osm_type'),
                'county': addr.get('county') or addr.get('state_district') or '',
                'state': addr.get('state') or '',
                'country': addr.get('country') or '',
                'country_code': addr.get('country_code') or '',
                'city': addr.get('city') or addr.get('town') or addr.get('village') or '',
            }), 200
    except Exception as e:
        print(f'Reverse geocoding error: {e}')
    return jsonify({'error': 'Could not reverse geocode'}), 404

@destinations_bp.route('', methods=['POST'])
@admin_required
def create_destination(current_user):
    data = request.form if request.form else request.get_json()
    missing = validate_required_fields(data, ['name'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    name = sanitize_input(data.get('name', ''), max_length=255)
    location_text = sanitize_input(data.get('location_text', ''), max_length=255)
    description = sanitize_input(data.get('description', ''), max_length=2000)
    link_url = data.get('link_url', '')
    sort_order = data.get('sort_order', 0, type=int)

    latitude = data.get('latitude')
    longitude = data.get('longitude')
    if latitude is not None and latitude != '':
        try: latitude = float(latitude)
        except: latitude = None
    else:
        latitude = None
    if longitude is not None and longitude != '':
        try: longitude = float(longitude)
        except: longitude = None
    else:
        longitude = None

    image_url = data.get('image_url', '')
    if request.files and 'image' in request.files:
        file = request.files['image']
        if file.filename and allowed_file(file.filename):
            image_url = save_image(file, 'destinations')

    if not image_url:
        image_url = ''

    if latitude is None or longitude is None:
        geocode_query = location_text or name
        latitude, longitude = geocode_location(geocode_query)

    dest = Destination(
        name=name, location_text=location_text, description=description,
        image_url=image_url, link_url=link_url, sort_order=sort_order,
        latitude=latitude, longitude=longitude
    )
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
    if 'location_text' in data:
        dest.location_text = sanitize_input(data['location_text'], max_length=255)
    if 'description' in data:
        dest.description = sanitize_input(data['description'], max_length=2000)
    if 'link_url' in data:
        dest.link_url = data['link_url']
    if 'sort_order' in data:
        dest.sort_order = int(data['sort_order'])
    if 'is_active' in data:
        dest.is_active = data['is_active'] in (True, 'true', '1', 1)
    if 'latitude' in data and data['latitude'] != '':
        dest.latitude = float(data['latitude'])
    if 'longitude' in data and data['longitude'] != '':
        dest.longitude = float(data['longitude'])
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
