from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tables import DrainageEdge
from app.schemas.common import DrainageSolveRequest, DrainageSolveResponse
from app.services.drainage_solver import EdgeInput, solve_drainage_network


router = APIRouter(prefix="/api/v1/drainage", tags=["drainage"])


@router.post("/solve", response_model=DrainageSolveResponse)
def solve_drainage(payload: DrainageSolveRequest, db: Session = Depends(get_db)):
    edges = db.scalars(select(DrainageEdge).order_by(DrainageEdge.id)).all()
    result = solve_drainage_network(
        edges=[EdgeInput(
            edge_id=edge.id,
            from_node_id=edge.from_node_id,
            to_node_id=edge.to_node_id,
            capacity_lps=edge.capacity_lps,
            diameter_mm=edge.diameter_mm,
            slope=edge.slope,
        ) for edge in edges],
        rainfall_runoff_lps=payload.rainfall_runoff_lps,
        blockage_factor=payload.blockage_factor,
        roughness=payload.roughness,
    )
    return result