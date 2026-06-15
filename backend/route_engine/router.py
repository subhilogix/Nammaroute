import networkx as nx
from route_engine.graph_builder import transit_graph

CARBON_PER_MODE = {
    "metro": 14,
    "bus": 68,
    "rail": 25,
    "auto": 120
}

def get_routes(source_id: str, dest_id: str, preference: str = "time") -> dict:
    G = transit_graph

    if source_id not in G.nodes:
        return {"error": f"Source stop {source_id} not found"}
    if dest_id not in G.nodes:
        return {"error": f"Destination stop {dest_id} not found"}

    results = []

    # Find routes optimized for each preference
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

                legs.append({
                    "from": G.nodes[path[i]]["name"],
                    "to": G.nodes[path[i+1]]["name"],
                    "mode": edge["mode"],
                    "time_minutes": edge["time"],
                    "cost_rs": edge["cost"],
                    "carbon_g": edge["carbon"],
                    "is_live": True,
                    "confidence": "Live"
                })

            label = "⚡ Fastest" if weight == "time" else "💸 Cheapest" if weight == "cost" else "🌱 Greenest"

            results.append({
                "label": label,
                "optimized_for": weight,
                "total_time_minutes": total_time,
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