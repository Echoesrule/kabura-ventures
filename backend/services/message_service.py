from models.message import Message
from models.user import User
from models import db
from utils.helpers import sanitize_input
from services.base import ServiceError


def get_all_messages(page=1, per_page=50, is_read=None):
    query = Message.query
    if is_read is not None:
        query = query.filter_by(is_read=is_read.lower() == 'true')
    messages = query.order_by(Message.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return [m.to_dict() for m in messages.items], {
        'total': messages.total, 'page': messages.page,
        'per_page': messages.per_page, 'pages': messages.pages
    }


def send_admin_message(recipient_id, subject, body):
    if not recipient_id or not subject or not body:
        raise ServiceError('recipient_id, subject, and body are required')
    message = Message(
        name='Admin', email='admin@kaburaadventures.com',
        subject=sanitize_input(subject, max_length=200),
        body=sanitize_input(body, max_length=5000),
        user_id=recipient_id, is_admin=True
    )
    db.session.add(message)
    db.session.commit()
    return message.to_dict(), 201


def mark_message_read(message):
    message.is_read = True
    db.session.commit()


def reply_to_message(message, admin_reply):
    if not admin_reply:
        raise ServiceError('admin_reply is required')
    message.admin_reply = sanitize_input(admin_reply, max_length=5000)
    message.is_read = True
    db.session.commit()
    return message.to_dict(), 200


def delete_message(message):
    db.session.delete(message)
    db.session.commit()
