from flask import Blueprint, request, jsonify, current_app
from models.media import HeroMedia, HeroImage, AuthSlide
from models import db
from middleware.auth import admin_required
from services import media_service
from services.base import ServiceError

admin_media_bp = Blueprint('admin_media', __name__, url_prefix='/api/admin/media')

@admin_media_bp.route('/hero', methods=['POST'])
@admin_required
def upload_hero_media(current_user):
    try:
        file = request.files.get('file')
        backend_url = current_app.config.get('BACKEND_URL') or request.url_root.rstrip('/')
        result, status = media_service.upload_hero_media(file, backend_url)
        return jsonify({'message': 'Media uploaded', 'media': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_media_bp.route('/hero/<media_id>', methods=['DELETE'])
@admin_required
def delete_hero_media(current_user, media_id):
    media = HeroMedia.query.get(media_id)
    if not media:
        return jsonify({'error': 'Media not found'}), 404
    media_service.delete_hero_media(media, current_app.root_path)
    return jsonify({'message': 'Media deleted'}), 200

@admin_media_bp.route('/hero/reorder', methods=['PUT'])
@admin_required
def reorder_hero_media(current_user):
    data = request.get_json()
    if not data or 'order' not in data:
        return jsonify({'error': 'order list required'}), 400
    media_service.reorder_hero_media(data['order'])
    return jsonify({'message': 'Order updated'}), 200

@admin_media_bp.route('/supabase-check', methods=['GET'])
@admin_required
def supabase_check(current_user):
    try:
        result = media_service.check_supabase()
        return jsonify({'status': 'ok', 'details': result}), 200
    except ServiceError as e:
        return jsonify({'error': e.message, 'details': str(e)}), e.status_code

@admin_media_bp.route('/hero-image', methods=['POST'])
@admin_required
def upload_hero_image(current_user):
    try:
        file = request.files.get('file')
        caption = request.form.get('caption')
        result, status = media_service.upload_hero_image(file, caption)
        return jsonify({'message': 'Hero image uploaded', 'image': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_media_bp.route('/hero-image/<image_id>', methods=['DELETE'])
@admin_required
def delete_hero_image(current_user, image_id):
    img = HeroImage.query.get(image_id)
    if not img:
        return jsonify({'error': 'Image not found'}), 404
    media_service.delete_hero_image(img)
    return jsonify({'message': 'Hero image deleted'}), 200

@admin_media_bp.route('/auth-slides', methods=['POST'])
@admin_required
def create_auth_slide(current_user):
    try:
        file = request.files.get('file')
        location = request.form.get('location')
        description = request.form.get('description')
        result, status = media_service.create_auth_slide(file, location, description)
        return jsonify({'message': 'Auth slide created', 'slide': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_media_bp.route('/auth-slides/<slide_id>', methods=['PUT'])
@admin_required
def update_auth_slide(current_user, slide_id):
    slide = AuthSlide.query.get(slide_id)
    if not slide:
        return jsonify({'error': 'Slide not found'}), 404
    try:
        location = request.form.get('location')
        description = request.form.get('description')
        file = request.files.get('file')
        result, status = media_service.update_auth_slide(slide, location, description, file)
        return jsonify({'message': 'Slide updated', 'slide': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_media_bp.route('/auth-slides/<slide_id>', methods=['DELETE'])
@admin_required
def delete_auth_slide(current_user, slide_id):
    slide = AuthSlide.query.get(slide_id)
    if not slide:
        return jsonify({'error': 'Slide not found'}), 404
    media_service.delete_auth_slide(slide)
    return jsonify({'message': 'Slide deleted'}), 200

@admin_media_bp.route('/auth-slides/reorder', methods=['PUT'])
@admin_required
def reorder_auth_slides(current_user):
    data = request.get_json()
    if not data or 'order' not in data:
        return jsonify({'error': 'order list required'}), 400
    media_service.reorder_auth_slides(data['order'])
    return jsonify({'message': 'Order updated'}), 200
