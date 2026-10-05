# What RainDrop actually does

This document is the single source of truth for what is real in this system,
what is an estimate, and what is placeholder content. If the UI and this
document ever disagree, the UI is wrong.

Last updated: 5 October 2026.

---

## The one-paragraph version

RainDrop takes hourly rainfall forecasts for six Indian cities, applies a
documented hydrological screening formula to estimate how deep water is likely
to get in a ward, and shows a citizen whether they can get through. The
pipeline works end to end. The depth figure is **a screening estimate, not a
validated model prediction**, and the system says so on every screen. The path
to a validated model is in [Getting to a validated model](#getting-to-a-validated-model)
below, and the work is specified, not hand-waved.

---

## Status of every number on screen

Every API response carries a `data_status` field. The UI renders it as a badge.

| `data_status` | Meaning | Where it appears |
|---|---|---|
| `live` | Retrieved from an external provider just now | Rainfall forecast, current conditions |
| `heuristic` | Computed from a documented formula, not a trained model | Flood depth, risk level, river level |
| `demo` | Fixed sample content, not derived from any live input | Evacuation corridors, ward reference data |
| `unavailable` | No trustworthy value could be produced | Sensor feeds, verification scores, pump status |

### Live

- **Hourly rainfall forecast** from Open-Meteo, requested in `Asia/Kolkata` and
  sliced from the current local hour. Cached per rounded coordinate for five
  minutes.
- **Current conditions**: temperature, humidity, wind, present precipitation.

### Heuristic

- **Flood depth in centimetres.** The rational method applied over the worst
  rainfall window in the forecast, minus a constant drainage removal rate,
  ponded over a slope-dependent fraction of the catchment. See
  `backend/app/services/flood_estimate.py`, where every assumption is listed in
  the module docstring. The `depth_workings` field in the API response shows the
  intermediate values so the number can be checked by hand.
- **Risk level.** Derived from the depth band, raised one step when rainfall
  intensity alone is dangerous.
- **River level.** A linear function of excess runoff against the ward's danger
  level. **No river gauge is connected.** The response says so.
- **Terrain statistics.** City-scale averages until a DEM raster is processed
  for that city. `dem_source` is `fallback` or `cartodem`, and the UI shows which.

### Demo

- **Evacuation corridors.** Real, named elevated roads in each city, held as a
  reference table. Not routed, not checked against live conditions.
- **Ward reference data**: boundaries, danger levels, installed pump counts.

### Unavailable

- **Ground sensors, Doppler radar, pump telemetry.** None are connected. The
  system states this rather than reporting a number.
- **Nowcast verification scores.** Shown only after
  `pipeline/evaluate_nowcast.py` has been run against real observations.
- **Trained surrogate output.** Shown only when a model artefact is installed
  *and* its model card reports a held-out score.

---

## What was removed in the October 2026 review

These are the specific claims the system used to make that it could not support.
They are listed so nobody reintroduces them.

| Removed claim | Why |
|---|---|
| `"is_real_api": true` | Hardcoded regardless of what ran |
| `"is_real_dem": true` for four cities | No DEM tile existed for any of them |
| "Live" badge, always green | Showed the wall clock, not the data time. Stale and sample data looked live |
| R² = 0.9994 | Measured on training data, from labels that were a formula of the same inputs |
| CSI / POD / FAR scores | Generated with `np.random` |
| "48 of 50 sensors online" | A constant. There is no sensor network |
| "Pipeline COMPLETED" | Returned without running anything |
| "Kalina-CST bypass, 100% dry" | Mumbai corridor shown in every city, with a guarantee nothing could support |
| Route distances and travel times | Generated from offsets around the city centre |
| "92% Surcharged", flow velocity | Computed from the depth estimate, measuring nothing |
| "Capacity: Available" on shelters | A constant. Sending someone to a full shelter during a flood is a real harm |
| "ZERO FLOOD DELAYS", "100% Engine Safety" | Guarantees of outcomes from an estimate |
| Meta description citing PostGIS telemetry and XGBoost | Neither is in the system |

---

## Getting to a validated model

### The modelling decision: EPA SWMM, not a 2-D model

Labels come from **EPA SWMM driven through PySWMM**, not from LISFLOOD-FP or
HEC-RAS 2D.

1. **It models the right mechanism.** Waterlogging in Chennai, Mumbai and Delhi
   is pluvial: rain arrives faster than the drains can remove it. SWMM is a
   drainage-network model, so pipe capacity and node surcharge are its primary
   variables. A 2-D model routes water over a surface and treats drainage as a
   sink term, which is backwards for this problem.
2. **A surrogate needs thousands of simulator runs to be worth training.** A
   SWMM design storm runs in seconds. A LISFLOOD-FP run over a city takes hours,
   which yields dozens of labelled scenarios, not a training set.
3. **2-D needs terrain we do not have.** Useful 2-D output needs 1–5 m terrain.
   CartoDEM is 30 m, coarser than the streets being modelled.
4. **It is auditable.** `models/swmm_labels.py` writes a readable `.inp` file
   per scenario that a municipal engineer can check.

**The honest limitation:** the drainage networks are *schematic*, built from
terrain and published design figures, because the GCC, BMC and MCD asset
registers are not public. Labels from a schematic network teach the surrogate
the behaviour of the system, not its specific geometry. Every label file records
`network_is_schematic: true`, and the model card lists observed floods under
`not_validated_against`.

### The steps, in order

```bash
# 1. Terrain. Put CartoDEM or SRTM tiles in data/raw/cartodem first.
python -m pipeline.process_dem --all

# 2. Labels from SWMM.
pip install pyswmm
python models/swmm_labels.py --city chennai --scenarios 400
python models/swmm_labels.py --city mumbai  --scenarios 400
python models/swmm_labels.py --city delhi   --scenarios 400

# 3. Train, holding out a whole city and a whole storm type.
python models/train_surrogate.py --holdout-city delhi
```

Step 3 prints the held-out MAE alongside three baselines and refuses to
recommend the model if it does not beat all of them. The backend will not load
the artefact unless its SHA-256 matches the model card, and will not call its
output a model prediction unless the card reports a held-out score.

### What is still missing after that

A surrogate trained on SWMM is validated **against SWMM**, not against reality.
To claim accuracy against real floods you need observed labels:

- Sentinel-1 SAR flood extents for dated events (Chennai Nov–Dec 2015, Mumbai
  Aug 2005 and Jul 2019, Delhi Jul 2023). Check scene availability for each date
  before planning around it.
- Municipal waterlogging-hotspot lists from GCC and BMC.
- Citizen reports with timestamps and locations.

With observed labels, predict **flooded / not flooded per cell** rather than a
depth in centimetres. Scoring a binary prediction against a SAR flood mask is
defensible; claiming centimetre accuracy against one is not.

---

## Rainfall: what can and cannot drive a nowcast

| Source | Latency | Usable for a 0–3 h nowcast? |
|---|---|---|
| Open-Meteo hourly forecast | minutes | Yes, and it is what the live system uses |
| IMERG Early (`3B-HHR-E`) | ~4 hours | Marginal. Honest as a near-real-time demo |
| IMERG Late (`3B-HHR-L`) | ~14 hours | No |
| IMERG Final (`3B-HHR`) | months | No. This is a hindcast dataset |
| IMD Doppler radar | minutes | Yes, and this is the right answer if access can be obtained |

Two constraints to state before anyone asks:

- **IMERG cells are 0.1° (~11 km).** A city-sized box is 3–4 cells across, which
  is far too small for optical flow to find a motion vector. Use a domain of
  roughly 500 km and sample the city from it. `pipeline/ingest_imerg.py` warns
  when the domain is too small.
- **IMERG is 30-minute data.** Twelve lead times is six hours, not one. The time
  step now travels with the raster in a sidecar so the API cannot mislabel it.

---

## Known weaknesses

State these before a judge finds them.

1. **The depth estimate has no measured error.** We can say what it is derived
   from, not how close it is to reality.
2. **An 11 km rain cell cannot justify street-level depth.** The ward-level
   estimate is the honest resolution. Sector depths shown on the map are
   modelled from the ward estimate and sample ground levels.
3. **The drainage network is schematic**, so blocked or silted drains, which
   cause much real waterlogging, are not represented.
4. **No tide or river backwater.** This matters most in Mumbai, where high tide
   locks the outfalls, and in coastal Chennai.
5. **Bengaluru (920 m) and Hyderabad (505 m) sit outside the elevation range of
   the focus cities** and are correspondingly less reliable. They are marked as
   non-focus cities in the API.
6. **No uncertainty range.** A single number implies a precision the method does
   not have. Quantile regression or conformal intervals are the next step.

---

## Answers to the questions judges ask

**Who is the user?**
Both, with different entry points. A citizen lands on "Is my street going to
flood?", picks a city and sees a depth estimate with passability advice; no
account needed. A control-room operator signs in and gets the dashboard, the
dispatch actions and the pipeline controls. Everything that commits municipal
resources is behind that sign-in and a confirmation step.

**What is your error in centimetres on a storm the model never saw?**
Unknown today, and we say so rather than quoting a number. Once SWMM labels
exist, `train_surrogate.py` reports held-out MAE against three baselines on a
split that holds out a whole city and a whole storm type. Against real floods it
remains unknown until observed labels exist.

**If the feed stopped five minutes ago, how does the operator know?**
The status badge is derived from the fetch outcome, not a clock. It reads Live,
Estimate, Stale or Offline, and shows the age of the data. When the feed is not
current a banner appears at the top of every view and live values stop
overriding sample data.

**Your rain cell is 11 km and your terrain cell is 30 m. How do you justify
street-level depth?**
We do not. The honest unit is the ward. See weakness 2.

**Why is this better than existing IMD warnings?**
IMD issues area warnings in millimetres of rain. This translates rain into the
decision a person actually makes: how deep the water will be where they are, and
whether they can get through. That is a different product, not a better forecast,
and we do not claim to forecast rainfall better than IMD.

---

## Running it

```bash
cp .env.example .env          # fill in the secrets; generate with: openssl rand -base64 32
docker compose up --build -d

# Create a control-room operator (the password is prompted, never on the command line)
python backend/scripts/manage_operators.py add \
    --username chennai.ops --name "GCC Control Room" --cities chennai

python -m pytest              # 94 tests
```

The database and the backend are reachable only on the Docker network. All
traffic goes through nginx, which applies the rate limits, body-size caps and
security headers.

### Changing the frontend

Both build artefacts are committed, so both can go stale against their source.

```bash
npm install          # once
npm run build:css    # after changing any className
npm run watch:css    # or leave this running while you work

python pipeline/transpile_frontend.py   # after changing anything in client/src
```

`client/tailwind.min.css` used to be a checked-in build with no way to
regenerate it, which meant **every utility class written after that build
produced no CSS at all, silently**. `z-[400]` never applied, so the offline
banner rendered behind the toolbar, and a button could end up with white text
on a transparent background. `setup.sh` and `setup.ps1` now run the build, and
CI fails if the committed stylesheet does not match a fresh one.
