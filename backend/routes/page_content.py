from flask import Blueprint, request, jsonify
from models.page_section import PageSection
from models import db

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
