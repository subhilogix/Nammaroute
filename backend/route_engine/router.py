import networkx as nx
from route_engine.graph_builder import transit_graph

CARBON_PER_MODE = {
    "metro": 14,
    "bus": 68,
    "rail": 25,
    "auto": 120
}

def get_routes(source_id: str, dest_id: str, preference: str = "time", simulate_incident: bool = False) -> dict:
    # Copy graph to allow dynamic, thread-safe weight mutations per request
    G = transit_graph.copy()

    # 1. Fetch live feed updates from Redis (via Floor 1)
    from data_layer.feeds import get_all_feeds
    feeds = get_all_feeds()

    # Map stop and mode to live status details
    live_lookup = {}
    for item in feeds:
        key = (item["stop_id"], item["mode"])
        live_lookup[key] = item

    # 2. Dynamically recalculate edge weights before pathfinding
    for u, v, data in G.edges(data=True):
        mode = data["mode"]
        # Look up live telemetry at start station u for this transit mode
        live_item = live_lookup.get((u, mode))

        if live_item:
            # Crowding multiplier
            if live_item["crowding"] == "High":
                data["time"] = round(data["time"] * 1.3, 1)
            elif live_item["crowding"] == "Medium":
                data["time"] = round(data["time"] * 1.1, 1)

            # Predicted scheduling buffer (increases cost of predicted ETAs slightly due to uncertainty)
            if live_item["confidence"] == "Predicted":
                data["time"] += 2.0

            # Dynamic delay offset in minutes
            details = live_item.get("details", {})
            if "delay_minutes" in details:
                data["time"] += details["delay_minutes"]

        # 3. Simulate specific incidents for dynamic re-routing testing
        if simulate_incident:
            # Simulate a bus blockage (e.g., massive traffic delays on all buses)
            if mode == "bus":
                data["time"] += 45.0
                data["incident"] = "⚠️ Alert: Heavy road block on MTC route. Bus delayed by 45 mins."
            # Simulate a specific metro disruption (e.g., Green Line delay)
            elif mode == "metro" and u == "CMRL_002" and v == "CMRL_003":
                data["time"] += 35.0
                data["incident"] = "⚠️ Metro alert: Signal fault between Egmore and Koyambedu. 35 mins delay."

    if source_id not in G.nodes:
        return {"error": f"Source stop {source_id} not found"}
    if dest_id not in G.nodes:
        return {"error": f"Destination stop {dest_id} not found"}

    results = []

    # Find routes optimized for each preference (Dijkstra)
    for weight in ["time", "cost", "carbon"]:
        try:
            path = nx.dijkstra_path(G, source_id, dest_id, weight=weight)
            total_time = 0
            total_cost = 0
            total_carbon = 0
            legs = []

            for i in range(len(path) - 1):
                edge = G[path[i]][path[i+1]]
                total_time += edge["time"]
                total_cost += edge["cost"]
                total_carbon += edge["carbon"]

                # Extract live state metrics for this leg
                leg_mode = edge["mode"]
                from_node = path[i]
                live_item = live_lookup.get((from_node, leg_mode))

                is_live = True
                confidence = "Live"
                crowding = "Low"
                details = {}

                if live_item:
                    is_live = live_item["is_live"]
                    confidence = live_item["confidence"]
                    crowding = live_item["crowding"]
                    details = live_item.get("details", {})

                legs.append({
                    "from": G.nodes[path[i]]["name"],
                    "to": G.nodes[path[i+1]]["name"],
                    "from_id": path[i],
                    "to_id": path[i+1],
                    "from_coords": [G.nodes[path[i]]["lat"], G.nodes[path[i]]["lon"]],
                    "to_coords": [G.nodes[path[i+1]]["lat"], G.nodes[path[i+1]]["lon"]],
                    "mode": leg_mode,
                    "time_minutes": round(edge["time"], 1),
                    "cost_rs": edge["cost"],
                    "carbon_g": edge["carbon"],
                    "is_live": is_live,
                    "confidence": confidence,
                    "crowding": crowding,
                    "details": details,
                    "incident": edge.get("incident", None)
                })

            label = "⚡ Fastest" if weight == "time" else "💸 Cheapest" if weight == "cost" else "🌱 Greenest"

            results.append({
                "label": label,
                "optimized_for": weight,
                "total_time_minutes": round(total_time, 1),
                "total_cost_rs": total_cost,
                "total_carbon_g": total_carbon,
                "legs": legs,
                "booking_link": "https://nammayatri.in"
            })

        except nx.NetworkXNoPath:
            continue

    return {
        "source": G.nodes[source_id]["name"],
        "destination": G.nodes[dest_id]["name"],
        "routes": results
    }