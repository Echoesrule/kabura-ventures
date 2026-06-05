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

media_bp = Blueprint('media', __name__, url_prefix='/api/media')

ALLOWED_VIDEO = {'mp4', 'webm', 'ogg'}

@media_bp.route('/hero', methods=['GET'])
def get_hero_media():
    media = HeroMedia.query.filter_by(is_active=True).order_by(HeroMedia.sort_order).all()
    return jsonify({'media': [m.to_dict() for m in media]}), 200

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
    if ext not in ALLOWED_VIDEO:
        return jsonify({'error': 'Allowed video formats: mp4, webm, ogg'}), 400
    if file.content_length and file.content_length > 200 * 1024 * 1024:
        return jsonify({'error': 'File exceeds maximum size of 200MB'}), 400

    filename = f"{uuid.uuid4()}.{ext}"
    upload_path = os.path.join(current_app.root_path, '..', 'frontend', 'assets', 'videos', filename)
    os.makedirs(os.path.dirname(upload_path), exist_ok=True)
    file.save(upload_path)

    count = HeroMedia.query.count()
    media = HeroMedia(
        filename=filename,
        file_url=f'/assets/videos/{filename}',
        sort_order=count
    )
    db.session.add(media)
    db.session.commit()

    return jsonify({'message': 'Video uploaded', 'media': media.to_dict()}), 201

@media_bp.route('/hero/<media_id>', methods=['DELETE'])
@admin_required
def delete_hero_media(current_user, media_id):
    media = HeroMedia.query.get(media_id)
    if not media:
        return jsonify({'error': 'Media not found'}), 404

    file_path = os.path.join(current_app.root_path, '..', 'frontend', 'assets', 'videos', media.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.session.delete(media)
    db.session.commit()
    return jsonify({'message': 'Video deleted'}), 200

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
