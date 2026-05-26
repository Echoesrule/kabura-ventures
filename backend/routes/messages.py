from flask import Blueprint, request, jsonify
from models.message import Message, Notification
from models import db
from middleware.auth import token_required, admin_required
from utils.helpers import validate_required_fields, validate_email, sanitize_input, validate_length

messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')

@messages_bp.route('', methods=['POST'])
def create_message():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['name', 'email', 'message'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400

    name = sanitize_input(data['name'], max_length=255)
    email = sanitize_input(data['email'], max_length=255).lower()
    subject = sanitize_input(data.get('subject', ''), max_length=255)
    message_text = sanitize_input(data['message'], max_length=5000)

    errors = []
    for label, val in [('Name', name), ('Email', email), ('Subject', subject)]:
        err = validate_length(val, 255, label)
        if err: errors.append(err)
    msg_err = validate_length(message_text, 5000, 'Message')
    if msg_err: errors.append(msg_err)
    if errors:
        return jsonify({'error': '. '.join(errors)}), 400

    message = Message(
        user_id=data.get('user_id'),
        name=name,
        email=email,
        subject=subject,
        message=message_text
    )

    db.session.add(message)
    db.session.commit()

    return jsonify({'message': 'Message sent successfully'}), 201

@messages_bp.route('', methods=['GET'])
@admin_required
def get_messages(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    is_read = request.args.get('is_read')

    query = Message.query
    if is_read is not None:
        query = query.filter_by(is_read=is_read.lower() == 'true')

    query = query.order_by(Message.created_at.desc())
    messages = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'messages': [m.to_dict() for m in messages.items],
        'total': messages.total,
        'page': messages.page,
        'per_page': messages.per_page,
        'pages': messages.pages
    }), 200

@messages_bp.route('/<message_id>/read', methods=['PUT'])
@admin_required
def mark_as_read(current_user, message_id):
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    message.is_read = True
    db.session.commit()
    return jsonify({'message': 'Message marked as read'}), 200

@messages_bp.route('/<message_id>/reply', methods=['PUT'])
@admin_required
def reply_to_message(current_user, message_id):
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404

    data = request.get_json()
    if not data or not data.get('admin_reply'):
        return jsonify({'error': 'Reply text is required'}), 400

    message.admin_reply = sanitize_input(data['admin_reply'], max_length=5000)
    message.is_read = True
    db.session.commit()

    return jsonify({'message': 'Reply sent', 'msg': message.to_dict()}), 200

@messages_bp.route('/<message_id>', methods=['DELETE'])
@admin_required
def delete_message(current_user, message_id):
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    db.session.delete(message)
    db.session.commit()
    return jsonify({'message': 'Message deleted'}), 200
