import os
import uuid
import re
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models.media import HeroMedia
from models import db
from middleware.auth import admin_required
from services.storage import test_supabase_bucket
from utils.helpers import allowed_file, sanitize_input
from services.storage import save_image, delete_image
from models.media import HeroImage
from flask import current_app

media_bp = Blueprint('media', __name__, url_prefix='/api/media')

ALLOWED_HERO_MEDIA = {'mp4', 'webm', 'ogg', 'jpg', 'jpeg', 'png', 'gif', 'webp'}
VIDEO_EXTENSIONS = {'mp4', 'webm', 'ogg'}
IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}

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

@media_bp.route('/hero', methods=['POST'])
@admin_required
def upload_hero_media(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    original_name = secure_filename(file.filename)
    ext = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else ''
    if ext not in ALLOWED_HERO_MEDIA:
        return jsonify({'error': 'Allowed formats: mp4, webm, ogg, jpg, png, webp, gif'}), 400

    is_video = ext in VIDEO_EXTENSIONS
    if is_video and file.content_length and file.content_length > 200 * 1024 * 1024:
        return jsonify({'error': 'File exceeds maximum size of 200MB'}), 400

    filename = f"{uuid.uuid4()}.{ext}"
    if is_video:
        upload_path = os.path.join(current_app.root_path, '..', 'frontend', 'assets', 'videos', filename)
        relative_url = f'/assets/videos/{filename}'
    else:
        upload_path = os.path.join(current_app.root_path, '..', 'frontend', 'assets', 'images', filename)
        relative_url = f'/assets/images/{filename}'

    os.makedirs(os.path.dirname(upload_path), exist_ok=True)
    file.save(upload_path)

    backend_url = current_app.config.get('BACKEND_URL') or request.url_root.rstrip('/')
    file_url = f"{backend_url}{relative_url}"

    count = HeroMedia.query.count()
    media = HeroMedia(
        filename=filename,
        file_url=file_url,
        sort_order=count
    )
    db.session.add(media)
    db.session.commit()

    return jsonify({'message': 'Media uploaded', 'media': media.to_dict()}), 201

@media_bp.route('/hero/<media_id>', methods=['DELETE'])
@admin_required
def delete_hero_media(current_user, media_id):
    media = HeroMedia.query.get(media_id)
    if not media:
        return jsonify({'error': 'Media not found'}), 404

    file_path = os.path.join(current_app.root_path, '..', 'frontend', media.file_url.lstrip('/'))
    if os.path.exists(file_path):
        os.remove(file_path)

    db.session.delete(media)
    db.session.commit()
    return jsonify({'message': 'Media deleted'}), 200

@media_bp.route('/hero/reorder', methods=['PUT'])
@admin_required
def reorder_hero_media(current_user):
    data = request.get_json()
    if not data or 'order' not in data:
        return jsonify({'error': 'order list required'}), 400

    for i, media_id in enumerate(data['order']):
        media = HeroMedia.query.get(media_id)
        if media:
            media.sort_order = i
    db.session.commit()
    return jsonify({'message': 'Order updated'}), 200


@media_bp.route('/supabase-check', methods=['GET'])
@admin_required
def supabase_check(current_user):
    try:
        result = test_supabase_bucket()
        return jsonify({'status': 'ok', 'details': result}), 200
    except Exception as exc:
        print('Supabase health check failed:', repr(exc))
        return jsonify({'error': 'Supabase storage check failed', 'details': str(exc)}), 500


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


@media_bp.route('/hero-image', methods=['POST'])
@admin_required
def upload_hero_image(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    # save image via storage service (supports supabase or local)
    try:
        file_url = save_image(file, 'hero')
    except Exception as exc:
        return jsonify({'error': 'Upload failed', 'details': str(exc)}), 500

    # get optional caption from form data
    caption = request.form.get('caption', '').strip() or None

    # mark existing images inactive
    HeroImage.query.update({'is_active': False})
    img = HeroImage(filename=file.filename, file_url=file_url, caption=caption, is_active=True)
    db.session.add(img)
    db.session.commit()
    return jsonify({'message': 'Hero image uploaded', 'image': img.to_dict()}), 201


@media_bp.route('/hero-image/<image_id>', methods=['DELETE'])
@admin_required
def delete_hero_image(current_user, image_id):
    img = HeroImage.query.get(image_id)
    if not img:
        return jsonify({'error': 'Image not found'}), 404
    try:
        delete_image(img.file_url)
    except Exception:
        pass
    db.session.delete(img)
    db.session.commit()
    return jsonify({'message': 'Hero image deleted'}), 200
