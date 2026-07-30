from flask import Blueprint, request, jsonify
from models.blog import Blog
from models import db

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
