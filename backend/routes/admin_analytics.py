from flask import Blueprint, jsonify
from middleware.auth import admin_required
from services import analytics_service

admin_analytics_bp = Blueprint('admin_analytics', __name__, url_prefix='/api/admin/analytics')

@admin_analytics_bp.route('', methods=['GET'])
@admin_required
def get_analytics(current_user):
    data = analytics_service.get_analytics()
    return jsonify(data), 200
