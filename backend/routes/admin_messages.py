from flask import Blueprint, request, jsonify
from models.message import Message
from models import db
from middleware.auth import admin_required
from services import message_service
from services.base import ServiceError

admin_messages_bp = Blueprint('admin_messages', __name__, url_prefix='/api/admin/messages')

@admin_messages_bp.route('', methods=['GET'])
@admin_required
def get_all_messages(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    is_read = request.args.get('is_read')
    messages, pagination = message_service.get_all_messages(page, per_page, is_read)
    return jsonify({'messages': messages, **pagination}), 200

@admin_messages_bp.route('/send', methods=['POST'])
@admin_required
def send_admin_message(current_user):
    try:
        data = request.get_json()
        result, status = message_service.send_admin_message(
            data.get('recipient_id'), data.get('subject'), data.get('body')
        )
        return jsonify({'message': 'Message sent', 'msg': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_messages_bp.route('/<message_id>/read', methods=['PUT'])
@admin_required
def mark_message_read(current_user, message_id):
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    message_service.mark_message_read(message)
    return jsonify({'message': 'Message marked as read'}), 200

@admin_messages_bp.route('/<message_id>/reply', methods=['PUT'])
@admin_required
def reply_to_message(current_user, message_id):
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    try:
        data = request.get_json()
        result, status = message_service.reply_to_message(message, data.get('admin_reply'))
        return jsonify({'message': 'Reply sent', 'msg': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_messages_bp.route('/<message_id>', methods=['DELETE'])
@admin_required
def delete_message(current_user, message_id):
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    message_service.delete_message(message)
    return jsonify({'message': 'Message deleted'}), 200
