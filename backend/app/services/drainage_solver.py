from dataclasses import dataclass
from math import pi, sqrt


@dataclass(frozen=True)
class EdgeInput:
    edge_id: int
    from_node_id: int
    to_node_id: int
    capacity_lps: float | None
    diameter_mm: float | None
    slope: float | None


def manning_capacity_lps(diameter_mm: float, slope: float, roughness: float = 0.013) -> float:
    if diameter_mm <= 0 or slope <= 0 or roughness <= 0:
        return 0.0
    diameter_m = diameter_mm / 1000
    area = pi * diameter_m**2 / 4
    hydraulic_radius = diameter_m / 4
    flow_m3_s = (1 / roughness) * area * hydraulic_radius ** (2 / 3) * sqrt(slope)
    return flow_m3_s * 1000


def solve_drainage_network(
    edges: list[EdgeInput],
    rainfall_runoff_lps: float,
    blockage_factor: float = 0,
    roughness: float = 0.013,
) -> dict:
    if rainfall_runoff_lps < 0:
        raise ValueError("rainfall runoff cannot be negative")
    if not 0 <= blockage_factor <= 0.95:
        raise ValueError("blockage factor must be between 0 and 0.95")

    capacities = []
    for edge in edges:
        base_capacity = edge.capacity_lps
        if base_capacity is None:
            base_capacity = manning_capacity_lps(edge.diameter_mm or 0, edge.slope or 0, roughness)
        capacities.append(max(0.0, base_capacity))
    total_capacity = sum(capacities)
    effective_capacities = [capacity * (1 - blockage_factor) for capacity in capacities]
    total_effective = sum(effective_capacities)

    remaining = rainfall_runoff_lps
    analysis = []
    for edge, capacity, effective_capacity in zip(edges, capacities, effective_capacities):
        allocated = min(effective_capacity, max(0.0, remaining))
        remaining -= allocated
        utilization = allocated / effective_capacity if effective_capacity else (1.0 if rainfall_runoff_lps else 0.0)
        analysis.append({
            "edge_id": edge.edge_id,
            "from_node_id": edge.from_node_id,
            "to_node_id": edge.to_node_id,
            "capacity_lps": capacity,
            "effective_capacity_lps": effective_capacity,
            "allocated_flow_lps": allocated,
            "utilization": utilization,
            "overloaded": utilization >= 1 and remaining > 0,
        })
    overloaded_edges = sum(1 for item in analysis if item["overloaded"])
    return {
        "rainfall_runoff_lps": rainfall_runoff_lps,
        "total_capacity_lps": total_capacity,
        "total_effective_capacity_lps": total_effective,
        "total_allocated_flow_lps": min(rainfall_runoff_lps, total_effective),
        "overloaded_edges": overloaded_edges,
        "network_overloaded": rainfall_runoff_lps > total_effective,
        "edges": analysis,
    }