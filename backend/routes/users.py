from flask import Blueprint, request, jsonify
from models.user import User
from middleware.auth import admin_required

users_bp = Blueprint('users', __name__, url_prefix='/api/users')


@users_bp.route('', methods=['GET'])
@admin_required
def get_all_users(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = User.query.order_by(User.created_at.desc())
    users = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'users': [u.to_dict() for u in users.items],
        'total': users.total,
        'page': users.page,
        'per_page': users.per_page,
        'pages': users.pages
    }), 200