import requests
from flask import Blueprint, request, jsonify, current_app
from models.destination import Destination
from models import db

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
