import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

stops = [
    ("CMRL_001", "Chennai Central", 13.0827, 80.2707, "metro"),
    ("CMRL_002", "Egmore", 13.0732, 80.2609, "metro"),
    ("CMRL_003", "Koyambedu", 13.0694, 80.1948, "metro"),
    ("CMRL_004", "Park Town", 13.0792, 80.2738, "metro"),
    ("CMRL_005", "Velachery", 12.9815, 80.2180, "metro"),
    ("CMRL_006", "Anna Nagar", 13.0850, 80.2101, "metro"),
    ("MTC_001", "Tambaram Bus Terminal", 12.9249, 80.1000, "bus"),
    ("MTC_002", "Koyambedu Bus Stand", 13.0694, 80.1948, "bus"),
    ("RAIL_001", "Chennai Central Rail", 13.0827, 80.2707, "rail"),
    ("RAIL_002", "Tambaram Rail", 12.9249, 80.1000, "rail"),
]

routes = [
    ("METRO_GREEN", "CMRL Green Line", "metro", 2.5),
    ("METRO_BLUE", "CMRL Blue Line", "metro", 2.5),
    ("MTC_23C", "MTC 23C", "bus", 0.8),
    ("MTC_70", "MTC 70", "bus", 0.8),
    ("RAIL_MSB", "MSB - Tambaram", "rail", 0.5),
]

def seed():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()

    for stop in stops:
        cur.execute("""
            INSERT INTO stops (stop_id, stop_name, stop_lat, stop_lon, mode)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (stop_id) DO NOTHING
        """, stop)

    for route in routes:
        cur.execute("""
            INSERT INTO routes (route_id, route_name, mode, fare_per_km)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (route_id) DO NOTHING
        """, route)

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Seeded successfully!")

if __name__ == "__main__":
    seed()