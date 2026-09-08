from datetime import datetime, timedelta, timezone

from geoalchemy2.elements import WKTElement

from app.db.session import SessionLocal, initialize_database
from app.models.tables import Alert, DrainageEdge, DrainageNode, FloodPrediction, Rainfall, Road


CITY_LATITUDE = 28.6139
CITY_LONGITUDE = 77.2090


def point(latitude: float, longitude: float) -> WKTElement:
    return WKTElement(f"POINT({longitude} {latitude})", srid=4326)


def line(points: list[tuple[float, float]]) -> WKTElement:
    coordinates = ", ".join(f"{longitude} {latitude}" for latitude, longitude in points)
    return WKTElement(f"LINESTRING({coordinates})", srid=4326)


def seed_demo_data() -> None:
    initialize_database()
    db = SessionLocal()
    try:
        roads = [
            Road(name="Demo Main Road", road_class="arterial", geometry=line([
                (CITY_LATITUDE - 0.02, CITY_LONGITUDE - 0.02),
                (CITY_LATITUDE + 0.02, CITY_LONGITUDE + 0.02),
            ])),
            Road(name="Demo Drain Road", road_class="local", geometry=line([
                (CITY_LATITUDE - 0.02, CITY_LONGITUDE + 0.02),
                (CITY_LATITUDE + 0.02, CITY_LONGITUDE - 0.02),
            ])),
        ]
        db.add_all(roads)
        db.flush()

        nodes = [
            DrainageNode(node_type="inlet", elevation_m=215.0, inlet_capacity_lps=80,
                         geometry=point(CITY_LATITUDE, CITY_LONGITUDE)),
            DrainageNode(node_type="outfall", elevation_m=212.0, inlet_capacity_lps=120,
                         geometry=point(CITY_LATITUDE + 0.01, CITY_LONGITUDE + 0.01)),
        ]
        db.add_all(nodes)
        db.flush()
        db.add(DrainageEdge(
            from_node_id=nodes[0].id,
            to_node_id=nodes[1].id,
            length_m=150,
            diameter_mm=900,
            slope=0.01,
            capacity_lps=100,
            geometry=line([
                (CITY_LATITUDE, CITY_LONGITUDE),
                (CITY_LATITUDE + 0.01, CITY_LONGITUDE + 0.01),
            ]),
        ))

        now = datetime.now(timezone.utc)
        db.add(Rainfall(
            observed_at=now,
            amount_mm=32.0,
            location=point(CITY_LATITUDE, CITY_LONGITUDE),
        ))
        db.add_all([
            FloodPrediction(
                predicted_at=now + timedelta(minutes=15),
                valid_until=now + timedelta(minutes=30),
                risk_level="high",
                water_depth_cm=18.0,
                road_id=roads[0].id,
                geometry=point(CITY_LATITUDE, CITY_LONGITUDE),
            ),
            FloodPrediction(
                predicted_at=now + timedelta(minutes=30),
                valid_until=now + timedelta(minutes=45),
                risk_level="critical",
                water_depth_cm=34.0,
                road_id=roads[1].id,
                geometry=point(CITY_LATITUDE + 0.01, CITY_LONGITUDE + 0.01),
            ),
        ])
        db.add(Alert(
            severity="high",
            message="Demo alert: water depth is expected to exceed 15 cm on Demo Main Road.",
            created_at=now,
            expires_at=now + timedelta(hours=3),
            geometry=point(CITY_LATITUDE, CITY_LONGITUDE),
        ))
        db.commit()
        print("Demo data seeded successfully.")
        print(f"Map center: {CITY_LATITUDE}, {CITY_LONGITUDE}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
