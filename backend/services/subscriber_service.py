from models.subscriber import Subscriber
from models import db


def get_subscribers(page=1, per_page=50):
    subscribers = Subscriber.query.order_by(Subscriber.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return [s.to_dict() for s in subscribers.items], {
        'total': subscribers.total, 'page': subscribers.page,
        'per_page': subscribers.per_page, 'pages': subscribers.pages
    }
