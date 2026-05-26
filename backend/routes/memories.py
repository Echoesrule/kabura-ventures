import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from models.memory import UserMemory, MemoryImage
from models import db
from middleware.auth import token_required, admin_required
from utils.helpers import sanitize_input, validate_length, validate_required_fields, allowed_file

memories_bp = Blueprint('memories', __name__, url_prefix='/api/memories')

@memories_bp.route('', methods=['GET'])
def get_approved_memories():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    memories = UserMemory.query.filter_by(approved=True)\
        .order_by(UserMemory.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'memories': [m.to_dict() for m in memories.items],
        'total': memories.total,
        'page': memories.page,
        'per_page': memories.per_page,
        'pages': memories.pages
    }), 200

@memories_bp.route('', methods=['POST'])
def submit_memory():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['title'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    if 'image_url' not in data and 'images' not in data:
        return jsonify({'error': 'Provide image_url or images array'}), 400

    title = sanitize_input(data['title'], max_length=255)
    location = sanitize_input(data.get('location', ''), max_length=255)
    image_url = sanitize_input(data.get('image_url', data.get('images', [''])[0] if isinstance(data.get('images'), list) and data['images'] else ''), max_length=500)
    caption = sanitize_input(data.get('caption', ''), max_length=2000)
    email = sanitize_input(data.get('email', ''), max_length=255)

    errors = []
    title_err = validate_length(title, 255, 'Title')
    if title_err: errors.append(title_err)
    location_err = validate_length(location, 255, 'Location')
    if location_err: errors.append(location_err)
    caption_err = validate_length(caption, 2000, 'Caption')
    if caption_err: errors.append(caption_err)
    if email:
        email_err = validate_length(email, 255, 'Email')
        if email_err: errors.append(email_err)

    if not image_url.startswith(('http://', 'https://', '/assets/images/')):
        errors.append('Image URL must be a valid URL')

    if errors:
        return jsonify({'error': '. '.join(errors)}), 400

    memory = UserMemory(
        title=title,
        location=location,
        image_url=image_url,
        caption=caption,
        email=email,
        approved=False
    )
    db.session.add(memory)
    db.session.flush()

    # Collect all image URLs
    all_urls = [image_url]
    additional = data.get('images', [])
    if isinstance(additional, list):
        for url in additional:
            if isinstance(url, str) and url != image_url:
                clean = sanitize_input(url, max_length=500)
                if clean.startswith(('http://', 'https://', '/assets/images/')):
                    all_urls.append(clean)

    for url in all_urls:
        mem_img = MemoryImage(memory_id=memory.id, image_url=url)
        db.session.add(mem_img)

    db.session.commit()

    return jsonify({'message': 'Memory submitted for review!', 'memory': memory.to_dict()}), 201

@memories_bp.route('/upload', methods=['POST'])
def upload_memory_image():
    files_to_process = []
    if 'images' in request.files:
        files_to_process = request.files.getlist('images')
    elif 'file' in request.files:
        files_to_process = [request.files['file']]

    if not files_to_process:
        return jsonify({'error': 'No file provided'}), 400

    urls = []
    for file in files_to_process:
        if not file or not file.filename:
            continue
        if not allowed_file(file.filename):
            return jsonify({'error': f'Invalid file type: {file.filename}. Allowed: png, jpg, jpeg, gif, webp'}), 400
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(upload_path)
        urls.append(f'/assets/images/{filename}')

    if not urls:
        return jsonify({'error': 'No valid files uploaded'}), 400

    return jsonify({'urls': urls, 'url': urls[0]}), 200

@memories_bp.route('/admin/all', methods=['GET'])
@admin_required
def get_all_memories(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    approved = request.args.get('approved')
    query = UserMemory.query
    if approved is not None:
        query = query.filter_by(approved=approved.lower() == 'true')
    memories = query.order_by(UserMemory.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'memories': [m.to_dict() for m in memories.items],
        'total': memories.total,
        'page': memories.page,
        'per_page': memories.per_page,
        'pages': memories.pages
    }), 200

@memories_bp.route('/<memory_id>/approve', methods=['PUT'])
@admin_required
def approve_memory(current_user, memory_id):
    memory = UserMemory.query.get(memory_id)
    if not memory:
        return jsonify({'error': 'Memory not found'}), 404
    memory.approved = True
    db.session.commit()
    return jsonify({'message': 'Memory approved', 'memory': memory.to_dict()}), 200

@memories_bp.route('/<memory_id>', methods=['DELETE'])
@admin_required
def delete_memory(current_user, memory_id):
    memory = UserMemory.query.get(memory_id)
    if not memory:
        return jsonify({'error': 'Memory not found'}), 404
    db.session.delete(memory)
    db.session.commit()
    return jsonify({'message': 'Memory deleted'}), 200
