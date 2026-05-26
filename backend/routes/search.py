from flask import Blueprint, request, jsonify
from models.tour import Tour
from models.hotel import Hotel
from models.blog import Blog
from models import db
from utils.helpers import sanitize_input

search_bp = Blueprint('search', __name__, url_prefix='/api/search')

@search_bp.route('', methods=['GET'])
def search_all():
    q = sanitize_input(request.args.get('q', ''), max_length=200)
    if not q or len(q) < 2:
        return jsonify({'results': [], 'query': q}), 200

    like = f'%{q}%'

    tours = Tour.query.filter(
        db.or_(Tour.title.ilike(like), Tour.description.ilike(like), Tour.location.ilike(like))
    ).order_by(Tour.created_at.desc()).limit(5).all()

    hotels = Hotel.query.filter(
        db.or_(Hotel.name.ilike(like), Hotel.description.ilike(like), Hotel.location.ilike(like))
    ).order_by(Hotel.created_at.desc()).limit(5).all()

    blogs = Blog.query.filter(
        db.or_(Blog.title.ilike(like), Blog.content.ilike(like), Blog.excerpt.ilike(like), Blog.tags.ilike(like))
    ).filter_by(published=True).order_by(Blog.published_at.desc().nullslast()).limit(5).all()

    results = []
    for t in tours:
        img = t.images.first()
        results.append({
            'type': 'tour',
            'id': t.id,
            'title': t.title,
            'subtitle': t.location or 'Kenya',
            'image': img.image_url if img else None,
            'url': f'/tour-detail.html?id={t.id}',
            'price': float(t.price) if t.price else 0
        })
    for h in hotels:
        img = h.images.first()
        results.append({
            'type': 'hotel',
            'id': h.id,
            'title': h.name,
            'subtitle': h.location or 'Kenya',
            'image': img.image_url if img else None,
            'url': f'/hotels.html?hotel={h.id}',
            'price': float(h.price_per_night) if h.price_per_night else 0
        })
    for b in blogs:
        results.append({
            'type': 'blog',
            'id': b.id,
            'title': b.title,
            'subtitle': b.category or 'Guide',
            'image': b.image_url,
            'url': f'/blog-detail.html?slug={b.slug}',
            'excerpt': b.excerpt
        })

    return jsonify({'results': results, 'query': q}), 200
