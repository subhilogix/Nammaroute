from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data_layer.feeds import get_all_feeds
from ml_model.eta_model import predict_eta
from datetime import datetime

app = FastAPI(title="NammaRoute API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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