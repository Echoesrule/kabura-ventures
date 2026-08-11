import time
from threading import Lock
from functools import wraps
from flask import request, jsonify, current_app

_rate_limit_records = {}
_rate_limit_lock = Lock()

# Prune stale keys once the dict grows beyond this many entries.
_MAX_RECORDS = 10000
# Any key with no activity older than this is considered stale.
_STALE_AFTER = 3600


def get_client_ip():
    """Return the client IP, ignoring spoofable headers unless behind a trusted proxy.

    X-Forwarded-For is only trusted when TRUST_PROXY_HEADERS is enabled. When it
    is enabled we take the LAST hop, which is the value appended by the immediate
    trusted proxy (the real client), rather than the first value the client can
    freely set.
    """
    if current_app.config.get('TRUST_PROXY_HEADERS', False):
        forwarded_for = request.headers.get('X-Forwarded-For', '')
        if forwarded_for:
            return forwarded_for.split(',')[-1].strip()
    return request.remote_addr or 'unknown'


def _prune_records():
    """Remove entries that have been inactive for _STALE_AFTER seconds."""
    if len(_rate_limit_records) < _MAX_RECORDS:
        return
    now = time.time()
    cutoff = now - _STALE_AFTER
    expired = [k for k, v in _rate_limit_records.items() if not v or v[-1] < cutoff]
    for k in expired:
        _rate_limit_records.pop(k, None)


def rate_limit(limit=10, window=60, key_prefix=None, config_key=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not current_app.config.get('RATE_LIMITING_ENABLED', True):
                return f(*args, **kwargs)

            cfg = current_app.config.get('RATE_LIMITS', {})
            if config_key and config_key in cfg:
                cfg_limit, cfg_window = cfg[config_key]
            else:
                cfg_limit, cfg_window = limit, window

            client_ip = get_client_ip()
            prefix = key_prefix or f.__name__
            key = f'{prefix}:{client_ip}'
            now = time.time()
            window_start = now - cfg_window

            with _rate_limit_lock:
                _prune_records()
                timestamps = _rate_limit_records.get(key, [])
                timestamps = [t for t in timestamps if t > window_start]
                if len(timestamps) >= cfg_limit:
                    retry_after = int(timestamps[0] + cfg_window - now) if timestamps else cfg_window
                    response = jsonify({'error': 'Too many requests, please try again later.'})
                    response.status_code = 429
                    response.headers['Retry-After'] = str(retry_after)
                    return response
                timestamps.append(now)
                _rate_limit_records[key] = timestamps

            return f(*args, **kwargs)

        return wrapper

    return decorator
