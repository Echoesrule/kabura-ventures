from models.user import User
from models import db


def get_all_users(page=1, per_page=50):
    users = User.query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return [u.to_dict() for u in users.items], {
        'total': users.total, 'page': users.page,
        'per_page': users.per_page, 'pages': users.pages
    }
