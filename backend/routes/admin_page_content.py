from flask import Blueprint, request, jsonify
from models.page_section import PageSection
from models import db
from middleware.auth import admin_required
from services import page_content_service
from services.base import ServiceError

admin_page_content_bp = Blueprint('admin_page_content', __name__, url_prefix='/api/admin/page-content')

@admin_page_content_bp.route('', methods=['POST'])
@admin_required
def save_section(current_user):
    try:
        data = request.get_json()
        result, status = page_content_service.save_section(
            data.get('section_key'), data.get('content')
        )
        return jsonify({'message': 'Section saved', 'section': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_page_content_bp.route('/<section_key>', methods=['DELETE'])
@admin_required
def delete_section(current_user, section_key):
    section = PageSection.query.filter_by(section_key=section_key).first()
    if not section:
        return jsonify({'error': 'Section not found'}), 404
    page_content_service.delete_section(section)
    return jsonify({'message': 'Section deleted'}), 200
