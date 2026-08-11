import os
import uuid
from werkzeug.utils import secure_filename
from models.media import HeroMedia, HeroImage, AuthSlide
from models import db
from services.storage import save_image, delete_image, test_supabase_bucket, process_upload
from utils.helpers import allowed_file
from services.base import ServiceError


def upload_hero_media(file, backend_url):
    if not file or not file.filename:
        raise ServiceError('No file provided')

    original_name = secure_filename(file.filename)
    ext = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else ''
    allowed = {'mp4', 'webm', 'ogg', 'jpg', 'jpeg', 'png', 'gif', 'webp'}
    if ext not in allowed:
        raise ServiceError('Allowed formats: mp4, webm, ogg, jpg, png, webp, gif')

    is_video = ext in {'mp4', 'webm', 'ogg'}
    if is_video and file.content_length and file.content_length > 200 * 1024 * 1024:
        raise ServiceError('File exceeds maximum size of 200MB')

    filename = f"{uuid.uuid4()}.{ext}"
    if is_video:
        upload_path = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'assets', 'videos', filename)
        relative_url = f'/assets/videos/{filename}'
        os.makedirs(os.path.dirname(upload_path), exist_ok=True)
        file.save(upload_path)
    else:
        content = process_upload(file)
        if content is None:
            raise ServiceError('Invalid image type')
        upload_path = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'assets', 'images', filename)
        relative_url = f'/assets/images/{filename}'
        os.makedirs(os.path.dirname(upload_path), exist_ok=True)
        with open(upload_path, 'wb') as fh:
            fh.write(content)

    file_url = f"{backend_url}{relative_url}"
    count = HeroMedia.query.count()
    media = HeroMedia(filename=filename, file_url=file_url, sort_order=count)
    db.session.add(media)
    db.session.commit()
    return media.to_dict(), 201


def delete_hero_media(media, app_root_path):
    file_path = os.path.join(app_root_path, '..', 'frontend', media.file_url.lstrip('/'))
    if os.path.exists(file_path):
        os.remove(file_path)
    db.session.delete(media)
    db.session.commit()


def reorder_hero_media(order):
    for i, media_id in enumerate(order):
        media = HeroMedia.query.get(media_id)
        if media:
            media.sort_order = i
    db.session.commit()


def upload_hero_image(file, caption=None):
    if not file or not file.filename:
        raise ServiceError('No file provided')
    if not allowed_file(file.filename):
        raise ServiceError('Invalid file type')

    file_url = save_image(file, 'hero')
    caption = (caption or '').strip() or None
    HeroImage.query.update({'is_active': False})
    img = HeroImage(filename=file.filename, file_url=file_url, caption=caption, is_active=True)
    db.session.add(img)
    db.session.commit()
    return img.to_dict(), 201


def delete_hero_image(img):
    try:
        delete_image(img.file_url)
    except Exception:
        pass
    db.session.delete(img)
    db.session.commit()


def create_auth_slide(file, location, description=None):
    if not file or not file.filename:
        raise ServiceError('No file provided')
    if not allowed_file(file.filename):
        raise ServiceError('Invalid file type')
    if not location:
        raise ServiceError('Location is required')

    file_url = save_image(file, 'auth-slides')
    count = AuthSlide.query.count()
    slide = AuthSlide(
        filename=file.filename, file_url=file_url,
        location=location.strip(),
        description=(description or '').strip(),
        sort_order=count
    )
    db.session.add(slide)
    db.session.commit()
    return slide.to_dict(), 201


def update_auth_slide(slide, location=None, description=None, file=None):
    if location is not None: slide.location = location.strip()
    if description is not None: slide.description = description.strip()
    if file and file.filename and allowed_file(file.filename):
        try:
            delete_image(slide.file_url)
        except Exception:
            pass
        slide.file_url = save_image(file, 'auth-slides')
        slide.filename = file.filename
    db.session.commit()
    return slide.to_dict(), 200


def delete_auth_slide(slide):
    try:
        delete_image(slide.file_url)
    except Exception:
        pass
    db.session.delete(slide)
    db.session.commit()


def reorder_auth_slides(order):
    for i, slide_id in enumerate(order):
        slide = AuthSlide.query.get(slide_id)
        if slide:
            slide.sort_order = i
    db.session.commit()


def check_supabase():
    return test_supabase_bucket()
