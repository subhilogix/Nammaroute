import networkx as nx

def build_transit_graph():
    G = nx.DiGraph()

    # ── NODES (every Chennai stop) ──
    stops = [
        ("CMRL_001", {"name": "Chennai Central", "lat": 13.0827, "lon": 80.2707, "mode": "metro"}),
        ("CMRL_002", {"name": "Egmore", "lat": 13.0732, "lon": 80.2609, "mode": "metro"}),
        ("CMRL_003", {"name": "Koyambedu", "lat": 13.0694, "lon": 80.1948, "mode": "metro"}),
        ("CMRL_004", {"name": "Park Town", "lat": 13.0792, "lon": 80.2738, "mode": "metro"}),
        ("CMRL_005", {"name": "Velachery", "lat": 12.9815, "lon": 80.2180, "mode": "metro"}),
        ("CMRL_006", {"name": "Anna Nagar", "lat": 13.0850, "lon": 80.2101, "mode": "metro"}),
        ("MTC_001", {"name": "Tambaram Bus Terminal", "lat": 12.9249, "lon": 80.1000, "mode": "bus"}),
        ("MTC_002", {"name": "Koyambedu Bus Stand", "lat": 13.0694, "lon": 80.1948, "mode": "bus"}),
        ("RAIL_001", {"name": "Chennai Central Rail", "lat": 13.0827, "lon": 80.2707, "mode": "rail"}),
        ("RAIL_002", {"name": "Tambaram Rail", "lat": 12.9249, "lon": 80.1000, "mode": "rail"}),
    ]

    for stop_id, data in stops:
        G.add_node(stop_id, **data)

    # ── EDGES (connections between stops) ──
    # Format: (from, to, time_min, cost_rs, carbon_g, mode)
    edges = [
        # Metro Green Line
        ("CMRL_001", "CMRL_002", 8, 20, 14, "metro"),
        ("CMRL_002", "CMRL_003", 12, 25, 20, "metro"),
        ("CMRL_001", "CMRL_004", 5, 15, 10, "metro"),
        ("CMRL_004", "CMRL_005", 18, 35, 30, "metro"),
        ("CMRL_003", "CMRL_006", 10, 20, 16, "metro"),

        # MTC Bus
        ("CMRL_003", "MTC_002", 3, 5, 8, "bus"),
        ("MTC_002", "MTC_001", 35, 15, 68, "bus"),
        ("MTC_002", "CMRL_006", 20, 10, 45, "bus"),
        ("CMRL_005", "MTC_001", 25, 12, 55, "bus"),

        # Suburban Rail
        ("RAIL_001", "RAIL_002", 35, 10, 25, "rail"),

        # Auto last-mile
        ("CMRL_003", "CMRL_006", 15, 80, 120, "auto"),
        ("CMRL_005", "CMRL_006", 12, 70, 110, "auto"),
        ("MTC_001", "RAIL_002", 5, 30, 60, "auto"),
    ]

    for from_stop, to_stop, time, cost, carbon, mode in edges:
        G.add_edge(from_stop, to_stop,
                   time=time,
                   cost=cost,
                   carbon=carbon,
                   mode=mode)

    return G

# Build graph once on startup
transit_graph = build_transit_graph()