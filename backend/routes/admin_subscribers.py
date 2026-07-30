from flask import Blueprint, request, jsonify
from middleware.auth import admin_required
from services import subscriber_service

admin_subscribers_bp = Blueprint('admin_subscribers', __name__, url_prefix='/api/admin/subscribers')

@admin_subscribers_bp.route('', methods=['GET'])
@admin_required
def get_subscribers(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    subscribers, pagination = subscriber_service.get_subscribers(page, per_page)
    return jsonify({'subscribers': subscribers, **pagination}), 200
