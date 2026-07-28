from flask import Blueprint, request, jsonify
from models.page_section import PageSection
from models import db
from middleware.auth import admin_required
from utils.helpers import sanitize_input

page_content_bp = Blueprint('page_content', __name__, url_prefix='/api/page-content')

@page_content_bp.route('', methods=['GET'])
def get_all_sections():
    sections = PageSection.query.all()
    result = {s.section_key: s.to_dict() for s in sections}
    return jsonify({'sections': result}), 200

@page_content_bp.route('/<section_key>', methods=['GET'])
def get_section(section_key):
    section = PageSection.query.filter_by(section_key=section_key).first()
    if not section:
        return jsonify({'section': None}), 200
    return jsonify({'section': section.to_dict()}), 200

@page_content_bp.route('', methods=['POST'])
@admin_required
def create_or_update_section(current_user):
    data = request.get_json()
    if not data or 'section_key' not in data:
        return jsonify({'error': 'section_key is required'}), 400

    section_key = data['section_key'].strip()
    section = PageSection.query.filter_by(section_key=section_key).first()

    if not section:
        section = PageSection(section_key=section_key)
        db.session.add(section)

    updatable_fields = [
        'title', 'subtitle', 'heading', 'description', 'grey_heading',
        'image_url', 'cta_text', 'cta_url',
        'stat1_number', 'stat1_label', 'stat2_number', 'stat2_label',
        'stat3_number', 'stat3_label', 'extra_json'
    ]
    for field in updatable_fields:
        if field in data:
            value = data[field]
            if field in ('stat1_number', 'stat2_number', 'stat3_number'):
                setattr(section, field, int(value) if value is not None else None)
            elif field == 'extra_json':
                setattr(section, field, str(value) if value else None)
            else:
                setattr(section, field, sanitize_input(str(value), max_length=2000) if value else '')

    db.session.commit()
    return jsonify({'message': 'Section saved', 'section': section.to_dict()}), 200

@page_content_bp.route('/<section_key>', methods=['DELETE'])
@admin_required
def delete_section(current_user, section_key):
    section = PageSection.query.filter_by(section_key=section_key).first()
    if not section:
        return jsonify({'error': 'Section not found'}), 404
    db.session.delete(section)
    db.session.commit()
    return jsonify({'message': 'Section deleted'}), 200
