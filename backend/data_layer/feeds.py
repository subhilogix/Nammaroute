import requests
import random
from datetime import datetime
from data_layer.cache import set_cache, get_cache
def fetch_mtc_feed():
    cached = get_cache("mtc_feed")
    if cached:
        return cached

    # Mock data — replace with real MTC GTFS-RT when available
    data = {
        "source": "MTC",
        "updated_at": datetime.now().isoformat(),
        "buses": [
            {"route": "23C", "stop": "Koyambedu", "eta_minutes": random.randint(3, 15), "is_live": True, "crowding": "Medium"},
            {"route": "70", "stop": "Tambaram", "eta_minutes": random.randint(5, 20), "is_live": True, "crowding": "High"},
        ]
    }
    set_cache("mtc_feed", data, expiry=30)
    return data

def fetch_cmrl_feed():
    cached = get_cache("cmrl_feed")
    if cached:
        return cached

    data = {
        "source": "CMRL",
        "updated_at": datetime.now().isoformat(),
        "trains": [
            {"line": "Green", "station": "Central", "eta_minutes": random.randint(2, 8), "is_live": True, "crowding": "Low"},
            {"line": "Blue", "station": "Egmore", "eta_minutes": random.randint(3, 10), "is_live": True, "crowding": "Medium"},
        ]
    }
    set_cache("cmrl_feed", data, expiry=30)
    return data

def fetch_rail_feed():
    cached = get_cache("rail_feed")
    if cached:
        return cached

    data = {
        "source": "Southern Railway",
        "updated_at": datetime.now().isoformat(),
        "trains": [
            {"train": "MSB-TBM", "station": "Central", "eta_minutes": random.randint(10, 35), "is_live": False, "crowding": "Low"},
        ]
    }
    set_cache("rail_feed", data, expiry=60)
    return data

def fetch_namma_yatri_feed():
    cached = get_cache("ny_feed")
    if cached:
        return cached

    data = {
        "source": "Namma Yatri",
        "updated_at": datetime.now().isoformat(),
        "autos": [
            {"area": "Koyambedu", "available": True, "eta_minutes": random.randint(3, 8), "surge": 1.0},
            {"area": "Anna Nagar", "available": True, "eta_minutes": random.randint(2, 6), "surge": 1.2},
        ]
    }
    set_cache("ny_feed", data, expiry=20)
    return data

def get_all_feeds():
    return {
        "mtc": fetch_mtc_feed(),
        "cmrl": fetch_cmrl_feed(),
        "rail": fetch_rail_feed(),
        "namma_yatri": fetch_namma_yatri_feed(),
    }