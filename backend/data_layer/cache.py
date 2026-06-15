import time

# Simple in-memory cache — replaces Redis for demo
_cache = {}

def set_cache(key: str, value: dict, expiry: int = 30):
    _cache[key] = {
        "value": value,
        "expires_at": time.time() + expiry
    }

def get_cache(key: str):
    if key in _cache:
        if time.time() < _cache[key]["expires_at"]:
            return _cache[key]["value"]
        else:
            del _cache[key]
    return None