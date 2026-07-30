from datetime import datetime
from models.blog import Blog
from models import db
from models.tour import slugify
from utils.helpers import validate_required_fields, sanitize_input, validate_length
from services.base import ServiceError


def get_all_blogs(page=1, per_page=20):
    blogs = Blog.query.order_by(Blog.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return [b.to_dict() for b in blogs.items], {
        'total': blogs.total, 'page': blogs.page,
        'per_page': blogs.per_page, 'pages': blogs.pages
    }


def create_blog(data):
    missing = validate_required_fields(data, ['title', 'content'])
    if missing:
        raise ServiceError(f'Missing fields: {", ".join(missing)}')

    title = sanitize_input(data['title'], max_length=255)
    content = sanitize_input(data['content'])
    err = validate_length(title, 255, 'Title')
    if err:
        raise ServiceError(err)

    base_slug = slugify(title)
    slug = base_slug
    counter = 1
    while Blog.query.filter_by(slug=slug).first():
        slug = f'{base_slug}-{counter}'
        counter += 1

    blog = Blog(
        title=title, slug=slug, content=content,
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
    return blog.to_dict(), 201


def update_blog(blog, data):
    if 'title' in data: blog.title = sanitize_input(data['title'], max_length=255)
    if 'content' in data: blog.content = sanitize_input(data['content'])
    if 'excerpt' in data: blog.excerpt = sanitize_input(data['excerpt'], max_length=500)
    if 'image_url' in data: blog.image_url = sanitize_input(data['image_url'], max_length=500)
    if 'author' in data: blog.author = sanitize_input(data['author'], max_length=100)
    if 'category' in data: blog.category = sanitize_input(data['category'], max_length=100)
    if 'tags' in data: blog.tags = sanitize_input(data['tags'], max_length=500)
    if 'published' in data:
        was_publishing = data['published'] and not blog.published
        blog.published = data['published']
        if was_publishing:
            blog.published_at = datetime.utcnow()
    db.session.commit()
    return blog.to_dict(), 200


def delete_blog(blog):
    db.session.delete(blog)
    db.session.commit()
