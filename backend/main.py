import threading
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data_layer.feeds import get_all_feeds
from ml_model.eta_model import predict_eta
from route_engine.router import get_routes
from datetime import datetime
from database.connection import get_db_connection

app = FastAPI(title="NammaRoute API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def save_feeds_to_db(feeds):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Clean existing live feed data and populate with fresh telemetry snapshot
        cur.execute("TRUNCATE TABLE live_feed RESTART IDENTITY")
        
        for item in feeds:
            cur.execute("""
                INSERT INTO live_feed (stop_id, route_id, eta_minutes, is_live, crowding, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                item["stop_id"],
                item["route_id"],
                int(item["eta_minutes"]),
                item["is_live"],
                item["crowding"],
                item["updated_at"]
            ))
        conn.commit()
        cur.close()
    except Exception as e:
        print(f"[WARN] Error saving feeds to PostgreSQL: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

# Background thread runner for periodic updates
def run_background_ingestion():
    print("[INFO] NammaRoute Ingestion Thread Started")
    # Initial sleep to allow DB and setup to stabilize
    time.sleep(2)
    while True:
        try:
            # get_all_feeds internally pulls/simulates and writes to Redis
            feeds_data = get_all_feeds()
            save_feeds_to_db(feeds_data)
        except Exception as e:
            print(f"[WARN] Ingestion worker loop error: {e}")
        time.sleep(15)

@app.on_event("startup")
def startup_event():
    threading.Thread(target=run_background_ingestion, daemon=True).start()

@app.get("/")
def root():
    return {"message": "NammaRoute Smart Commute Engine is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/feeds")
def feeds():
    return get_all_feeds()

@app.get("/predict-eta")
def predict(mode: str, distance_km: float):
    now = datetime.now()
    return predict_eta(
        hour=now.hour,
        day_of_week=now.weekday(),
        distance_km=distance_km,
        mode=mode
    )

@app.get("/route")
def route(source: str, destination: str, preference: str = "time"):
    return get_routes(source, destination, preference)

@app.get("/stops")
def stops():
    from route_engine.graph_builder import transit_graph
    return [
        {"id": node, **data}
        for node, data in transit_graph.nodes(data=True)
    ]