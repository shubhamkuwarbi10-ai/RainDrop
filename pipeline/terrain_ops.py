"""Terrain operations that are correct rather than fast-and-wrong.

The previous implementations in process_dem.py had three defects that every
downstream number inherited:

1. **No depression filling**, despite writing files named `*_dem_filled.tif`.
   Without it, D8 flow terminates in every pit and accumulation is meaningless.

2. **"Flow accumulation" counted neighbours that had any flow direction at all**,
   not cells that actually drain into the target. The result was a number
   between 1 and 5 everywhere, carrying no catchment information.

3. **Slope assumed 30 m cell spacing on a geographic (degree) grid.** One degree
   of longitude is about 109 km at Chennai's latitude and 98 km at Delhi's, so
   the x-spacing was wrong by a factor of ~3600 and varied between cities.

`pysheds` and `richdem` do all of this well. Neither is installed here, so this
module implements the three operations directly, with the algorithm named so a
reviewer can check it.
"""
from __future__ import annotations

import heapq

import numpy as np

# D8 neighbour offsets with the ESRI direction codes used by the rest of the
# pipeline, ordered E, SE, S, SW, W, NW, N, NE.
D8_NEIGHBOURS = [
    (0, 1, 1), (1, 1, 2), (1, 0, 4), (1, -1, 8),
    (0, -1, 16), (-1, -1, 32), (-1, 0, 64), (-1, 1, 128),
]


def fill_depressions(elevation: np.ndarray, epsilon: float = 1e-3) -> np.ndarray:
    """Priority-flood depression filling (Barnes, Lehman & Mulla, 2014).

    Raises every cell to the lowest elevation at which water could escape to
    the grid edge, then adds a small gradient so filled flats still drain.
    O(n log n) in the number of cells.
    """
    filled = elevation.astype(np.float64, copy=True)
    rows, cols = filled.shape
    closed = np.zeros((rows, cols), dtype=bool)
    queue: list[tuple[float, int, int]] = []

    # Seed the priority queue with the grid boundary: water leaves there.
    for row in range(rows):
        for col in (0, cols - 1):
            heapq.heappush(queue, (filled[row, col], row, col))
            closed[row, col] = True
    for col in range(1, cols - 1):
        for row in (0, rows - 1):
            heapq.heappush(queue, (filled[row, col], row, col))
            closed[row, col] = True

    while queue:
        level, row, col = heapq.heappop(queue)
        for d_row, d_col, _ in D8_NEIGHBOURS:
            neighbour_row, neighbour_col = row + d_row, col + d_col
            if not (0 <= neighbour_row < rows and 0 <= neighbour_col < cols):
                continue
            if closed[neighbour_row, neighbour_col]:
                continue
            closed[neighbour_row, neighbour_col] = True
            # A cell lower than its outlet is a pit: raise it just above.
            if filled[neighbour_row, neighbour_col] <= level:
                filled[neighbour_row, neighbour_col] = level + epsilon
            heapq.heappush(queue, (filled[neighbour_row, neighbour_col], neighbour_row, neighbour_col))

    return filled


def d8_flow_direction(elevation: np.ndarray) -> np.ndarray:
    """Steepest-descent D8 direction, by drop per unit distance.

    Diagonal neighbours are sqrt(2) cells away, so the drop is divided by the
    distance; otherwise diagonals win too often on gentle terrain.
    """
    rows, cols = elevation.shape
    best_slope = np.full((rows, cols), -np.inf)
    direction = np.zeros((rows, cols), dtype=np.uint8)

    padded = np.pad(elevation, 1, mode="edge")
    centre = elevation

    for d_row, d_col, code in D8_NEIGHBOURS:
        shifted = padded[1 + d_row: 1 + d_row + rows, 1 + d_col: 1 + d_col + cols]
        drop = (centre - shifted) / np.hypot(d_row, d_col)
        steeper = drop > best_slope
        best_slope = np.where(steeper, drop, best_slope)
        direction = np.where(steeper, code, direction)

    # A cell with no downhill neighbour drains nowhere.
    direction[best_slope <= 0] = 0
    return direction


def d8_flow_accumulation(direction: np.ndarray) -> np.ndarray:
    """Count the cells draining through each cell, including itself.

    Processes cells in topological order using in-degree, so each cell is
    visited once its upstream contributors have been accumulated. This is the
    real quantity: the previous code counted neighbours that merely had a
    direction, which is unrelated to catchment area.
    """
    rows, cols = direction.shape
    code_to_offset = {code: (d_row, d_col) for d_row, d_col, code in D8_NEIGHBOURS}

    # receiver[r, c] = flat index of the cell that r,c drains into, or -1.
    receiver = np.full(rows * cols, -1, dtype=np.int64)
    in_degree = np.zeros(rows * cols, dtype=np.int32)

    for code, (d_row, d_col) in code_to_offset.items():
        mask = direction == code
        if not mask.any():
            continue
        source_rows, source_cols = np.nonzero(mask)
        target_rows = source_rows + d_row
        target_cols = source_cols + d_col
        inside = (
            (target_rows >= 0) & (target_rows < rows)
            & (target_cols >= 0) & (target_cols < cols)
        )
        source_flat = (source_rows[inside] * cols + source_cols[inside])
        target_flat = (target_rows[inside] * cols + target_cols[inside])
        receiver[source_flat] = target_flat
        np.add.at(in_degree, target_flat, 1)

    accumulation = np.ones(rows * cols, dtype=np.float64)
    ready = [index for index in range(rows * cols) if in_degree[index] == 0]

    while ready:
        index = ready.pop()
        target = receiver[index]
        if target < 0:
            continue
        accumulation[target] += accumulation[index]
        in_degree[target] -= 1
        if in_degree[target] == 0:
            ready.append(target)

    return accumulation.reshape(rows, cols).astype(np.float32)


def slope_degrees(elevation: np.ndarray, cell_size_m: float) -> np.ndarray:
    """Slope in degrees. `cell_size_m` must be metres, so project first."""
    gradient_y, gradient_x = np.gradient(elevation, cell_size_m, cell_size_m)
    return np.degrees(np.arctan(np.hypot(gradient_x, gradient_y)))


def depression_depth(original: np.ndarray, filled: np.ndarray) -> np.ndarray:
    """How deep each filled depression was: where water pools first."""
    return np.maximum(0.0, filled - original).astype(np.float32)


def utm_epsg_for(longitude: float, latitude: float) -> int:
    """UTM zone EPSG code for a coordinate. India is all northern hemisphere."""
    zone = int((longitude + 180) // 6) + 1
    return (32600 if latitude >= 0 else 32700) + zone
