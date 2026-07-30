from flask import Blueprint, request, jsonify
from middleware.auth import admin_required
from services import user_service

admin_users_bp = Blueprint('admin_users', __name__, url_prefix='/api/admin/users')

@admin_users_bp.route('', methods=['GET'])
@admin_required
def get_all_users(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    users, pagination = user_service.get_all_users(page, per_page)
    return jsonify({'users': users, **pagination}), 200
