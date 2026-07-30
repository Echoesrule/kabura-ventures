from flask import Blueprint, request, jsonify, current_app
from models.media import HeroMedia, HeroImage, AuthSlide
from models import db

media_bp = Blueprint('media', __name__, url_prefix='/api/media')

@media_bp.route('/hero', methods=['GET'])
def get_hero_media():
    media = HeroMedia.query.filter_by(is_active=True).order_by(HeroMedia.sort_order).all()
    backend_url = current_app.config.get('BACKEND_URL') or request.url_root.rstrip('/')
    items = []
    for m in media:
        d = m.to_dict()
        if d['file_url'] and not d['file_url'].startswith('http'):
            d['file_url'] = f"{backend_url}{d['file_url']}"
        items.append(d)
    return jsonify({'media': items}), 200

@media_bp.route('/hero-image', methods=['GET'])
def get_hero_image():
    img = HeroImage.query.filter_by(is_active=True).order_by(HeroImage.created_at.desc()).first()
    if not img:
        return jsonify({'image': None}), 200
    d = img.to_dict()
    backend_url = current_app.config.get('BACKEND_URL') or request.url_root.rstrip('/')
    if d['file_url'] and not d['file_url'].startswith('http'):
        d['file_url'] = f"{backend_url}{d['file_url']}"
    return jsonify({'image': d}), 200

@media_bp.route('/auth-slides', methods=['GET'])
def get_auth_slides():
    slides = AuthSlide.query.filter_by(is_active=True).order_by(AuthSlide.sort_order).all()
    backend_url = current_app.config.get('BACKEND_URL') or request.url_root.rstrip('/')
    items = []
    for s in slides:
        d = s.to_dict()
        if d['file_url'] and not d['file_url'].startswith('http'):
            d['file_url'] = f"{backend_url}{d['file_url']}"
        items.append(d)
    return jsonify({'slides': items}), 200
