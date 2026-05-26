from datetime import datetime
from flask import Blueprint, request, jsonify
from models.blog import Blog, slugify
from models import db
from middleware.auth import admin_required
from utils.helpers import sanitize_input, validate_length, validate_required_fields

blogs_bp = Blueprint('blogs', __name__, url_prefix='/api/blogs')

@blogs_bp.route('', methods=['GET'])
def get_blogs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    category = request.args.get('category')
    search = request.args.get('search')
    published_only = request.args.get('published', 'true').lower() == 'true'

    query = Blog.query
    if published_only:
        query = query.filter_by(published=True)
    if category:
        query = query.filter(Blog.category == category)
    if search:
        like = f'%{search}%'
        query = query.filter(
            db.or_(Blog.title.ilike(like), Blog.content.ilike(like), Blog.excerpt.ilike(like), Blog.tags.ilike(like))
        )
    query = query.order_by(Blog.published_at.desc().nullslast(), Blog.created_at.desc())
    blogs = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'blogs': [b.to_brief() for b in blogs.items],
        'total': blogs.total,
        'page': blogs.page,
        'per_page': blogs.per_page,
        'pages': blogs.pages
    }), 200

@blogs_bp.route('/categories', methods=['GET'])
def get_categories():
    rows = db.session.query(Blog.category).filter(Blog.published == True).distinct().all()
    categories = [r[0] for r in rows if r[0]]
    return jsonify({'categories': categories}), 200

@blogs_bp.route('/<slug>', methods=['GET'])
def get_blog(slug):
    blog = Blog.query.filter_by(slug=slug).first()
    if not blog or not blog.published:
        return jsonify({'error': 'Blog not found'}), 404
    return jsonify({'blog': blog.to_dict()}), 200

@blogs_bp.route('/admin/all', methods=['GET'])
@admin_required
def get_all_blogs_admin(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    blogs = Blog.query.order_by(Blog.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'blogs': [b.to_dict() for b in blogs.items],
        'total': blogs.total,
        'page': blogs.page,
        'per_page': blogs.per_page,
        'pages': blogs.pages
    }), 200

@blogs_bp.route('', methods=['POST'])
@admin_required
def create_blog(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['title', 'content'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    title = sanitize_input(data['title'], max_length=255)
    content = sanitize_input(data['content'])
    errors = []
    title_err = validate_length(title, 255, 'Title')
    if title_err: errors.append(title_err)
    if errors:
        return jsonify({'error': '. '.join(errors)}), 400

    base_slug = slugify(title)
    slug = base_slug
    counter = 1
    while Blog.query.filter_by(slug=slug).first():
        slug = f'{base_slug}-{counter}'
        counter += 1

    blog = Blog(
        title=title,
        slug=slug,
        content=content,
        excerpt=sanitize_input(data.get('excerpt', ''), max_length=500),
        image_url=sanitize_input(data.get('image_url', ''), max_length=500),
        author=sanitize_input(data.get('author', 'Kabura Adventures'), max_length=100),
        category=sanitize_input(data.get('category', 'general'), max_length=100),
        tags=sanitize_input(data.get('tags', ''), max_length=500),
        published=data.get('published', False),
        published_at=datetime.utcnow() if data.get('published') else None
    )

    db.session.add(blog)
    db.session.commit()
    return jsonify({'message': 'Blog created', 'blog': blog.to_dict()}), 201

@blogs_bp.route('/<blog_id>', methods=['PUT'])
@admin_required
def update_blog(current_user, blog_id):
    blog = Blog.query.get(blog_id)
    if not blog:
        return jsonify({'error': 'Blog not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'title' in data:
        blog.title = sanitize_input(data['title'], max_length=255)
    if 'content' in data:
        blog.content = sanitize_input(data['content'])
    if 'excerpt' in data:
        blog.excerpt = sanitize_input(data['excerpt'], max_length=500)
    if 'image_url' in data:
        blog.image_url = sanitize_input(data['image_url'], max_length=500)
    if 'author' in data:
        blog.author = sanitize_input(data['author'], max_length=100)
    if 'category' in data:
        blog.category = sanitize_input(data['category'], max_length=100)
    if 'tags' in data:
        blog.tags = sanitize_input(data['tags'], max_length=500)
    if 'published' in data:
        was_publishing = data['published'] and not blog.published
        blog.published = data['published']
        if was_publishing:
            blog.published_at = datetime.utcnow()

    db.session.commit()
    return jsonify({'message': 'Blog updated', 'blog': blog.to_dict()}), 200

@blogs_bp.route('/<blog_id>', methods=['DELETE'])
@admin_required
def delete_blog(current_user, blog_id):
    blog = Blog.query.get(blog_id)
    if not blog:
        return jsonify({'error': 'Blog not found'}), 404
    db.session.delete(blog)
    db.session.commit()
    return jsonify({'message': 'Blog deleted'}), 200
