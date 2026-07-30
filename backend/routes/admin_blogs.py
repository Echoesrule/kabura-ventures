from flask import Blueprint, request, jsonify
from models.blog import Blog
from models import db
from middleware.auth import admin_required
from services import blog_service
from services.base import ServiceError

admin_blogs_bp = Blueprint('admin_blogs', __name__, url_prefix='/api/admin/blogs')

@admin_blogs_bp.route('', methods=['GET'])
@admin_required
def get_all_blogs_admin(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    blogs, pagination = blog_service.get_all_blogs(page, per_page)
    return jsonify({'blogs': blogs, **pagination}), 200

@admin_blogs_bp.route('', methods=['POST'])
@admin_required
def create_blog(current_user):
    try:
        data = request.get_json()
        result, status = blog_service.create_blog(data)
        return jsonify({'message': 'Blog created', 'blog': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_blogs_bp.route('/<blog_id>', methods=['PUT'])
@admin_required
def update_blog(current_user, blog_id):
    blog = Blog.query.get(blog_id)
    if not blog:
        return jsonify({'error': 'Blog not found'}), 404
    try:
        data = request.get_json()
        result, status = blog_service.update_blog(blog, data)
        return jsonify({'message': 'Blog updated', 'blog': result}), status
    except ServiceError as e:
        return jsonify({'error': e.message}), e.status_code

@admin_blogs_bp.route('/<blog_id>', methods=['DELETE'])
@admin_required
def delete_blog(current_user, blog_id):
    blog = Blog.query.get(blog_id)
    if not blog:
        return jsonify({'error': 'Blog not found'}), 404
    blog_service.delete_blog(blog)
    return jsonify({'message': 'Blog deleted'}), 200
