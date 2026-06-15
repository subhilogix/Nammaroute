CREATE TABLE IF NOT EXISTS stops (
    stop_id VARCHAR(50) PRIMARY KEY,
    stop_name VARCHAR(200) NOT NULL,
    stop_lat FLOAT NOT NULL,
    stop_lon FLOAT NOT NULL,
    mode VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(50) PRIMARY KEY,
    route_name VARCHAR(200),
    mode VARCHAR(20),
    fare_per_km FLOAT
);

CREATE TABLE IF NOT EXISTS stop_times (
    id SERIAL PRIMARY KEY,
    route_id VARCHAR(50),
    stop_id VARCHAR(50),
    arrival_time VARCHAR(20),
    departure_time VARCHAR(20),
    stop_sequence INT
);

CREATE TABLE IF NOT EXISTS live_feed (
    id SERIAL PRIMARY KEY,
    stop_id VARCHAR(50),
    route_id VARCHAR(50),
    eta_minutes INT,
    is_live BOOLEAN DEFAULT FALSE,
    crowding VARCHAR(20),
    updated_at TIMESTAMP DEFAULT NOW()
);