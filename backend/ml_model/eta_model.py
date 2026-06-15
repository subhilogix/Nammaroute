import lightgbm as lgb
import numpy as np
import pandas as pd

def generate_training_data():
    np.random.seed(42)
    n = 1000
    data = pd.DataFrame({
        "hour": np.random.randint(0, 24, n),
        "day_of_week": np.random.randint(0, 7, n),
        "route_distance_km": np.random.uniform(1, 30, n),
        "mode_encoded": np.random.randint(0, 4, n),
        "is_peak_hour": np.random.randint(0, 2, n),
    })
    data["eta_minutes"] = (
        data["route_distance_km"] * 2.5
        + data["is_peak_hour"] * 8
        + np.random.normal(0, 3, n)
    ).clip(2, 90)
    return data

def train_model():
    data = generate_training_data()
    X = data.drop("eta_minutes", axis=1)
    y = data["eta_minutes"]
    model = lgb.LGBMRegressor(n_estimators=100, learning_rate=0.1)
    model.fit(X, y)
    return model

model = train_model()

def predict_eta(hour: int, day_of_week: int, distance_km: float, mode: str) -> dict:
    mode_map = {"metro": 0, "bus": 1, "rail": 2, "auto": 3}
    is_peak = 1 if hour in [8, 9, 17, 18, 19] else 0

    features = pd.DataFrame([{
        "hour": hour,
        "day_of_week": day_of_week,
        "route_distance_km": distance_km,
        "mode_encoded": mode_map.get(mode, 1),
        "is_peak_hour": is_peak
    }])

    eta = model.predict(features)[0]
    reason = "peak hour traffic" if is_peak else "normal schedule"

    return {
        "eta_minutes": round(float(eta), 1),
        "is_live": False,
        "confidence": "Predicted",
        "reason": reason
    }