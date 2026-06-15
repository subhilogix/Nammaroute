import time
import os
import json
import redis
from dotenv import load_dotenv

load_dotenv()

# Initialize Redis client with protocol=2 (for backward compatibility on older Redis servers)
_redis_client = None
try:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    _redis_client = redis.Redis.from_url(redis_url, protocol=2, socket_timeout=2)
    _redis_client.ping()
    print("[OK] Successfully connected to Redis!")
except Exception as e:
    print(f"[WARN] Redis connection failed: {e}. Falling back to in-memory cache.")
    _redis_client = None

# Fallback in-memory cache
_in_memory_cache = {}

def set_cache(key: str, value: dict, expiry: int = 30):
    if _redis_client:
        try:
            _redis_client.setex(key, expiry, json.dumps(value))
            return
        except Exception as e:
            print(f"[WARN] Redis set_cache error: {e}. Writing to in-memory cache.")

    _in_memory_cache[key] = {
        "value": value,
        "expires_at": time.time() + expiry
    }

def get_cache(key: str):
    if _redis_client:
        try:
            val = _redis_client.get(key)
            if val:
                return json.loads(val.decode("utf-8"))
        except Exception as e:
            print(f"[WARN] Redis get_cache error: {e}. Reading from in-memory cache.")


    if key in _in_memory_cache:
        if time.time() < _in_memory_cache[key]["expires_at"]:
            return _in_memory_cache[key]["value"]
        else:
            del _in_memory_cache[key]
    return None