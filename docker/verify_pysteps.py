"""
Build-time check that optical flow actually works in this image.

pysteps treats opencv as an optional dependency, so it imports fine and then fails
at runtime with MissingOptionalDependency the first time a nowcast is run. This
fails the image build instead.

Injects a storm field translating a known +2 px/step and asserts the recovered
motion matches. Thresholding the field first is deliberate: Lucas-Kanade tracks
features, and a dense noise field without rain-free gaps has none to lock onto.
"""
import sys

import numpy as np
from pysteps.extrapolation.semilagrangian import extrapolate
from pysteps.motion.lucaskanade import dense_lucaskanade

KNOWN_U = 2.0  # px per timestep, eastward

rng = np.random.default_rng(0)
field = rng.gamma(1.0, 2.0, (80, 80)).astype(np.float32)
field[field < 1.0] = 0.0                       # rain-free gaps give trackable edges
sequence = np.stack([np.roll(field, i * int(KNOWN_U), axis=1) for i in range(4)])

motion = dense_lucaskanade(sequence)
u = float(np.median(motion[0]))
v = float(np.median(motion[1]))

forecast = extrapolate(sequence[-1], motion, 3)
nan_count = int(np.isnan(forecast).sum())

print(f"recovered motion u={u:+.2f} v={v:+.2f} px/step (injected u={KNOWN_U:+.2f} v=+0.00)")
print(f"forecast shape {forecast.shape}, NaNs {nan_count} (semi-Lagrangian fills edges)")

if abs(u - KNOWN_U) > 0.5 or abs(v) > 0.5:
    print(f"FAIL: motion field does not match the injected translation", file=sys.stderr)
    raise SystemExit(1)

print("optical flow OK")
