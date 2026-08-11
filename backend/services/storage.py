import os
import uuid
from io import BytesIO
from urllib.parse import urlparse
from flask import current_app, request
from supabase import create_client
from werkzeug.utils import secure_filename
from PIL import Image, ImageOps
from utils.helpers import allowed_file

MAX_IMAGE_SIZE = 1920
IMAGE_QUALITY = 80


def _process_image(content: bytes, ext: str, max_size: int = MAX_IMAGE_SIZE, quality: int = IMAGE_QUALITY) -> bytes:
    """Downscale + recompress an image. GIFs (animated) pass through untouched."""
    ext = (ext or '').lower()
    if ext == 'gif':
        return content

    img = Image.open(BytesIO(content))
    try:
        if img.format and img.format.upper() == 'GIF':
            return content
        has_alpha = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
        if has_alpha:
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        img = ImageOps.exif_transpose(img)
        img.thumbnail((max_size, max_size), Image.LANCZOS)

        out = BytesIO()
        if ext == 'png':
            img.save(out, 'PNG', optimize=True)
        elif ext == 'webp':
            img.save(out, 'WEBP', quality=quality, method=4)
        else:
            img.convert('RGB').save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
        return out.getvalue()
    finally:
        img.close()


def process_upload(file, max_size: int = MAX_IMAGE_SIZE, quality: int = IMAGE_QUALITY):
    """Read, verify and optimize an uploaded image file. Returns bytes."""
    if not file or not hasattr(file, 'filename') or not allowed_file(file.filename):
        return None
    file.stream.seek(0)
    content = file.read()
    valid, err = _verify_image(content)
    if not valid:
        raise ValueError(err)
    filename = secure_filename(file.filename)
    ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''
    return _process_image(content, ext, max_size, quality)


def _use_supabase_storage() -> bool:
    return current_app.config.get('STORAGE_PROVIDER', 'local').lower() == 'supabase'


def _get_supabase_client():
    url = current_app.config.get('SUPABASE_URL')
    key = current_app.config.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        return None
    return create_client(url, key)


def _get_bucket_name() -> str:
    return current_app.config.get('SUPABASE_STORAGE_BUCKET', 'public')


def _normalize_filename(file):
    original = secure_filename(getattr(file, 'filename', '') or '')
    name, ext = os.path.splitext(original)
    if not name:
        name = str(uuid.uuid4())
    if not ext:
        ext = '.jpg'
    return f"{uuid.uuid4()}{ext}"


def _local_url(filename: str) -> str:
    host_url = current_app.config.get('BACKEND_URL') or request.url_root
    return f"{host_url.rstrip('/')}/assets/images/{filename}"


def _verify_image(content: bytes) -> tuple[bool, str]:
    try:
        img = Image.open(BytesIO(content))
        img.verify()
        return True, ''
    except Exception:
        return False, 'Corrupted or invalid image file'

def save_image(file, folder: str = 'images') -> str | None:
    if not file or not hasattr(file, 'filename') or not allowed_file(file.filename):
        return None

    content = process_upload(file)
    if content is None:
        return None
    file.stream = BytesIO(content)

    filename = _normalize_filename(file)
    if _use_supabase_storage():
        client = _get_supabase_client()
        if client is None:
            raise RuntimeError('Supabase storage is enabled but SUPABASE_URL or SUPABASE_SERVICE_KEY is missing')

        bucket_name = _get_bucket_name()
        path = f"{folder}/{filename}"
        file.stream.seek(0)
        content = file.read()
        if isinstance(content, str):
            content = content.encode('utf-8')

        try:
            client.storage.from_(bucket_name).upload(
                path,
                content,
                file_options={
                    'content-type': file.mimetype or 'application/octet-stream'
                },
            )
        except Exception as exc:
            print('=' * 60)
            print('Supabase upload failed:')
            print('  STORAGE_PROVIDER:', current_app.config.get('STORAGE_PROVIDER'))
            print('  bucket=', bucket_name)
            print('  path=', path)
            print('  mimetype=', file.mimetype)
            print('  file size=', len(content), 'bytes')
            try:
                response = exc.response
            except Exception:
                response = None
            if response is not None:
                try:
                    print('  status_code=', response.status_code)
                except Exception:
                    pass
                try:
                    print('  response_text=', response.text[:500])
                except Exception:
                    pass
                try:
                    print('  response_headers=', dict(response.headers))
                except Exception:
                    pass
            print('  exception type=', type(exc).__name__)
            print('  exception=', repr(exc))
            print('=' * 60)
            raise

        return client.storage.from_(bucket_name).get_public_url(path)

    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    upload_path = os.path.join(upload_folder, filename)
    file.stream.seek(0)
    file.save(upload_path)
    return _local_url(filename)


def _extract_storage_path(image_url: str, bucket: str) -> str | None:
    if not image_url:
        return None
    parsed = urlparse(image_url)
    # Examples of Supabase public URLs:
    # - /storage/v1/object/public/<bucket>/path/to/file.jpg
    # - /object/public/<bucket>/path/to/file.jpg
    # - /<bucket>/path/to/file.jpg (older or custom formats)
    path = parsed.path.lstrip('/')
    # Look for the public bucket segment anywhere in the path
    marker = f"/public/{bucket}/"
    if marker in parsed.path:
        return parsed.path.split(marker, 1)[1].lstrip('/')

    # handle '/object/public/<bucket>/...'
    parts = path.split('/')
    if len(parts) >= 4 and parts[0] in ('object', 'storage', 'storage/v1') and parts[1] == 'public' and parts[2] == bucket:
        return '/'.join(parts[3:])

    # handle '/<bucket>/path'
    if len(parts) >= 2 and parts[0] == bucket:
        return '/'.join(parts[1:])

    return None


def test_supabase_bucket() -> dict:
    client = _get_supabase_client()
    if client is None:
        raise RuntimeError('Supabase storage is enabled but SUPABASE_URL or SUPABASE_SERVICE_KEY is missing')

    bucket_name = _get_bucket_name()
    files = client.storage.from_(bucket_name).list('')
    return {
        'bucket': bucket_name,
        'file_count': len(files),
        'files': files[:10]
    }


def delete_image(image_url: str) -> None:
    if not image_url:
        return

    if _use_supabase_storage():
        client = _get_supabase_client()
        if client is None:
            return
        bucket_name = _get_bucket_name()
        key = _extract_storage_path(image_url, bucket_name)
        if key:
            try:
                client.storage.from_(bucket_name).remove(key)
            except Exception:
                pass
            return

    if image_url.startswith('/assets/images/'):
        filename = image_url.split('/assets/images/', 1)[1]
    else:
        parsed = urlparse(image_url)
        if parsed.path.startswith('/assets/images/'):
            filename = parsed.path.split('/assets/images/', 1)[1]
        else:
            return

    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass
