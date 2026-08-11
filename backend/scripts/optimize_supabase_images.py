"""One-off migration: downscale + recompress existing images in Supabase storage.

Downloads every image from the storage bucket, processes it (<=1920px, q80),
and upserts the optimized version back in place — same path, so stored URLs
and database references stay valid. Never deletes anything.

Usage:
    python optimize_supabase_images.py            # apply changes
    python optimize_supabase_images.py --dry-run  # preview only
"""
import os
import sys

from dotenv import load_dotenv

load_dotenv()

from supabase import create_client
from PIL import Image, ImageOps
from io import BytesIO

IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}
CONTENT_TYPES = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
}
MAX_SIZE = 1920
QUALITY = 80
RETRIES = 4


def get_client():
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        print('ERROR: SUPABASE_URL / SUPABASE_SERVICE_KEY missing from environment')
        return None, None
    return create_client(url, key), os.environ.get('SUPABASE_STORAGE_BUCKET', 'public')


def with_retry(fn, path, what):
    import time
    last = None
    for attempt in range(1, RETRIES + 1):
        try:
            return fn()
        except Exception as exc:
            last = exc
            print(f'  retry {attempt}/{RETRIES} {what} {path}: {exc}', flush=True)
            time.sleep(4 * attempt)
    raise last


def list_files(client, bucket, prefix=''):
    """Recursively yield file paths in the bucket."""
    entries = client.storage.from_(bucket).list(prefix)
    for entry in entries:
        name = entry.get('name', '')
        is_folder = entry.get('id') is None
        path = f"{prefix}/{name}" if prefix else name
        if is_folder:
            yield from list_files(client, bucket, path)
        else:
            yield path


def process_image(content: bytes, ext: str) -> bytes:
    """Downscale + recompress. GIFs pass through untouched."""
    ext = (ext or '').lower()
    if ext == 'gif':
        return content
    img = Image.open(BytesIO(content))
    try:
        if img.format and img.format.upper() == 'GIF':
            return content
        has_alpha = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
        img = img.convert('RGBA' if has_alpha else 'RGB')
        img = ImageOps.exif_transpose(img)
        img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
        out = BytesIO()
        if ext == 'png':
            img.save(out, 'PNG', optimize=True)
        elif ext == 'webp':
            img.save(out, 'WEBP', quality=QUALITY, method=4)
        else:
            img.convert('RGB').save(out, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        return out.getvalue()
    finally:
        img.close()


def run(dry_run, only_folder=None):
    client, bucket = get_client()
    if client is None:
        return 1
    print(f'Bucket: {bucket}' + ('  (DRY RUN - no changes)' if dry_run else ''))

    files = sorted(list_files(client, bucket))
    if only_folder:
        files = [f for f in files if f.startswith(only_folder + '/') or f == only_folder]
    images = [f for f in files if f.rsplit('.', 1)[-1].lower() in IMAGE_EXTENSIONS]
    print(f'Found {len(files)} files ({len(files) - len(images)} non-image skipped)')

    processed = skipped = failed = 0
    saved = 0
    for path in images:
        ext = path.rsplit('.', 1)[-1].lower()
        try:
            data = with_retry(lambda: client.storage.from_(bucket).download(path), path, 'download')
        except Exception as exc:
            failed += 1
            print(f'FAIL  download {path}: {exc}', flush=True)
            continue
        orig = len(data)
        try:
            new = process_image(data, ext)
        except Exception as exc:
            failed += 1
            print(f'FAIL  process {path}: {exc}', flush=True)
            continue
        if len(new) >= orig * 0.9:
            skipped += 1
            print(f'SKIP  {path}: {orig / 1024:.0f}K (no gain)', flush=True)
            continue
        if dry_run:
            processed += 1
            print(f'DRY   {path}: {orig / 1024:.0f}K -> {len(new) / 1024:.0f}K', flush=True)
            continue
        try:
            with_retry(
                lambda: client.storage.from_(bucket).upload(
                    path,
                    new,
                    file_options={'content-type': CONTENT_TYPES[ext], 'upsert': 'true'},
                ),
                path, 'upload',
            )
        except Exception as exc:
            failed += 1
            print(f'FAIL  upload {path}: {exc}', flush=True)
            continue
        processed += 1
        saved += orig - len(new)
        print(f'OK    {path}: {orig / 1024:.0f}K -> {len(new) / 1024:.0f}K', flush=True)

    print(f'\nDone: {processed} optimized, {skipped} skipped, {failed} failed, '
          f'~{saved / 1024 / 1024:.1f}MB saved')
    return 0 if not failed else 1


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    folder = args[0] if args else None
    sys.exit(run('--dry-run' in sys.argv, folder))
