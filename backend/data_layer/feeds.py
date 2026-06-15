import os
import time
import random
import requests
from datetime import datetime
from data_layer.cache import set_cache, get_cache
from ml_model.eta_model import predict_eta

# 1. Unified Schema definition and helper
def create_unified_feed_item(feed_id, mode, route_id, stop_id, stop_name, eta_minutes, is_live, crowding, confidence=None, details=None):
    if confidence is None:
        confidence = "Live" if is_live else "Predicted"
    return {
        "id": feed_id,
        "mode": mode,
        "route_id": route_id,
        "stop_id": stop_id,
        "stop_name": stop_name,
        "eta_minutes": round(float(eta_minutes), 1),
        "is_live": bool(is_live),
        "confidence": confidence,
        "crowding": crowding, # Low, Medium, High
        "updated_at": datetime.now().isoformat(),
        "details": details or {}
    }

# 2. Dynamic Live Feeds with ML Fallback
def fetch_mtc_feed():
    """
    MTC Buses.
    Allows fetching from an external URL if configured in MTC_API_URL, 
    otherwise runs a dynamic moving telemetry simulator with ML-fallback.
    """
    url = os.getenv("MTC_API_URL")
    if url:
        try:
            res = requests.get(url, timeout=3)
            if res.status_code == 200:
                # Assuming the external API returns unified JSON or we parse it
                return res.json()
        except Exception as e:
            print(f"[WARN] MTC External Feed failed: {e}. Falling back to simulator.")

    # Simulator with dynamic time-based ETA (updates every second)
    now = datetime.now()
    sec_offset = int(time.time())
    
    buses_sim = [
        {"id": "MTC_B01", "route_id": "MTC_23C", "stop_id": "CMRL_003", "stop_name": "Koyambedu", "distance": 4.5, "crowding": "Medium", "is_live_chance": 0.85},
        {"id": "MTC_B02", "route_id": "MTC_23C", "stop_id": "CMRL_006", "stop_name": "Anna Nagar", "distance": 2.1, "crowding": "High", "is_live_chance": 0.9},
        {"id": "MTC_B03", "route_id": "MTC_70", "stop_id": "MTC_001", "stop_name": "Tambaram Bus Terminal", "distance": 12.4, "crowding": "Low", "is_live_chance": 0.50},
        {"id": "MTC_B04", "route_id": "MTC_70", "stop_id": "MTC_002", "stop_name": "Koyambedu Bus Stand", "distance": 6.8, "crowding": "High", "is_live_chance": 0.8},
    ]
    
    feed_items = []
    for bus in buses_sim:
        # Simulate dynamic ETA that counts down towards zero and then resets
        base_eta = (bus["distance"] * 3) # ~3 mins per km
        time_elapsed = (sec_offset // 15) % 30 # countdown pattern reset every 7.5 mins
        sim_eta = max(1.0, base_eta - (time_elapsed * 0.5))

        # Check if GPS is live (simulating patchy MTC network)
        # We use a seed based on the bus ID and the current hour so it doesn't flip every second
        random.seed(bus["id"] + str(now.hour) + str(now.minute // 2))
        is_live = random.random() < bus["is_live_chance"]
        
        confidence = "Live"
        eta = sim_eta

        if not is_live:
            # Fallback Layer: Invokes LightGBM model for predicted ETA
            pred = predict_eta(
                hour=now.hour,
                day_of_week=now.weekday(),
                distance_km=bus["distance"],
                mode="bus"
            )
            eta = pred["eta_minutes"]
            confidence = "Predicted"
            
        feed_items.append(
            create_unified_feed_item(
                feed_id=bus["id"],
                mode="bus",
                route_id=bus["route_id"],
                stop_id=bus["stop_id"],
                stop_name=bus["stop_name"],
                eta_minutes=eta,
                is_live=is_live,
                crowding=bus["crowding"],
                confidence=confidence,
                details={"gps_signal": "strong" if is_live else "lost", "distance_km": bus["distance"]}
            )
        )
    return feed_items

def fetch_cmrl_feed():
    """
    CMRL Metro.
    Checks CMRL_API_URL or runs a dynamic train schedule simulator.
    """
    url = os.getenv("CMRL_API_URL")
    if url:
        try:
            res = requests.get(url, timeout=3)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"[WARN] CMRL External Feed failed: {e}. Falling back to simulator.")

    sec_offset = int(time.time())
    
    trains_sim = [
        {"id": "CMRL_T01", "route_id": "METRO_GREEN", "stop_id": "CMRL_001", "stop_name": "Chennai Central", "interval": 6, "crowding": "Low"},
        {"id": "CMRL_T02", "route_id": "METRO_GREEN", "stop_id": "CMRL_002", "stop_name": "Egmore", "interval": 8, "crowding": "Medium"},
        {"id": "CMRL_T03", "route_id": "METRO_BLUE", "stop_id": "CMRL_004", "stop_name": "Park Town", "interval": 7, "crowding": "Medium"},
        {"id": "CMRL_T04", "route_id": "METRO_BLUE", "stop_id": "CMRL_005", "stop_name": "Velachery", "interval": 10, "crowding": "High"},
    ]
    
    feed_items = []
    for train in trains_sim:
        # Dynamic ETA: modulo interval
        sim_eta = max(1.0, train["interval"] - (sec_offset // 20) % train["interval"])
        
        feed_items.append(
            create_unified_feed_item(
                feed_id=train["id"],
                mode="metro",
                route_id=train["route_id"],
                stop_id=train["stop_id"],
                stop_name=train["stop_name"],
                eta_minutes=sim_eta,
                is_live=True,
                crowding=train["crowding"],
                confidence="Live",
                details={"platform": "Platform 1" if sim_eta > 2 else "Platform 2", "frequency_minutes": train["interval"]}
            )
        )
    return feed_items

def fetch_rail_feed():
    """
    Southern Railway.
    Checks RAIL_API_URL or simulates suburban rails.
    """
    url = os.getenv("RAIL_API_URL")
    if url:
        try:
            res = requests.get(url, timeout=3)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"[WARN] Southern Rail External Feed failed: {e}. Falling back to simulator.")

    sec_offset = int(time.time())
    
    rail_sim = [
        {"id": "SR_S01", "route_id": "RAIL_MSB", "stop_id": "RAIL_001", "stop_name": "Chennai Central Rail", "schedule_eta": 15},
        {"id": "SR_S02", "route_id": "RAIL_MSB", "stop_id": "RAIL_002", "stop_name": "Tambaram Rail", "schedule_eta": 22},
    ]
    
    feed_items = []
    for rail in rail_sim:
        # Simulating a live delay + countdown
        time_elapsed = (sec_offset // 30) % 30
        live_delay = 5 if (sec_offset // 120) % 2 == 0 else 0  # Dynamic 5 min delays
        sim_eta = max(2.0, rail["schedule_eta"] + live_delay - time_elapsed)
        is_live = (live_delay == 0) # Mark as predicted fallback if running status is irregular or offline
        
        feed_items.append(
            create_unified_feed_item(
                feed_id=rail["id"],
                mode="rail",
                route_id=rail["route_id"],
                stop_id=rail["stop_id"],
                stop_name=rail["stop_name"],
                eta_minutes=sim_eta,
                is_live=is_live,
                crowding="Medium" if sim_eta > 10 else "High",
                confidence="Live" if is_live else "Predicted",
                details={"delay_minutes": live_delay, "status": "On Time" if live_delay == 0 else "Delayed"}
            )
        )
    return feed_items

def fetch_namma_yatri_feed():
    """
    Namma Yatri.
    Checks NAMMA_YATRI_API_URL or simulates local autos around transit nodes.
    """
    url = os.getenv("NAMMA_YATRI_API_URL")
    if url:
        try:
            res = requests.get(url, timeout=3)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"[WARN] Namma Yatri External Feed failed: {e}. Falling back to simulator.")

    # Auto last-mile services near all major nodes
    areas = [
        ("CMRL_001", "Chennai Central"),
        ("CMRL_003", "Koyambedu"),
        ("CMRL_005", "Velachery"),
        ("MTC_001", "Tambaram"),
        ("CMRL_006", "Anna Nagar"),
    ]
    
    sec_offset = int(time.time())
    feed_items = []
    
    for idx, (stop_id, stop_name) in enumerate(areas):
        # Dynamic surge and ETA calculations
        random.seed(stop_id + str(sec_offset // 60))
        autos_avail = random.randint(2, 10)
        surge = round(1.0 + (0.3 if autos_avail < 4 else 0.0) + (0.2 if (sec_offset // 180) % 2 == 0 else 0.0), 1)
        eta = random.randint(2, 7)
        
        feed_items.append(
            create_unified_feed_item(
                feed_id=f"NY_A0{idx}",
                mode="auto",
                route_id="NAMMA_YATRI",
                stop_id=stop_id,
                stop_name=stop_name,
                eta_minutes=eta,
                is_live=True,
                crowding="Low", # Autos don't have crowding, but set default
                confidence="Live",
                details={"available_drivers": autos_avail, "surge_multiplier": surge}
            )
        )
    return feed_items

# 3. Aggregate all feeds into a single normalized array
def get_all_feeds():
    """
    Combines all source streams into a single list of normalized items.
    Tries reading from Redis cache first, falling back to active pulls.
    """
    cached = get_cache("unified_transit_feeds")
    if cached:
        return cached

    # Query all active pipelines
    all_items = []
    try:
        all_items.extend(fetch_mtc_feed())
    except Exception as e:
        print(f"Error compiling MTC feeds: {e}")
        
    try:
        all_items.extend(fetch_cmrl_feed())
    except Exception as e:
        print(f"Error compiling CMRL feeds: {e}")
        
    try:
        all_items.extend(fetch_rail_feed())
    except Exception as e:
        print(f"Error compiling Railway feeds: {e}")
        
    try:
        all_items.extend(fetch_namma_yatri_feed())
    except Exception as e:
        print(f"Error compiling Namma Yatri feeds: {e}")

    # Cache the aggregated status for 10 seconds to limit CPU load on rapid calls
    set_cache("unified_transit_feeds", all_items, expiry=10)
    return all_items