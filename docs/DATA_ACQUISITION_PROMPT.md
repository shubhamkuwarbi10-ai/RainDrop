# Data acquisition prompt

Paste everything below the line into an AI agent that has web access and can write
files into this repo. It describes what RainDrop already has, what is missing, and
what "done" looks like for each gap.

Keep this file updated as gaps close.

---

You are helping acquire real data for **RainDrop**, an urban flood nowcasting
project for Indian cities (Chennai, Mumbai, Delhi). Your job is to find, verify and
download real datasets, or to report honestly that a dataset is not obtainable.

## Ground rules

1. **Never invent a URL, dataset name, API endpoint, DOI or access procedure.** If
   you are not sure a source exists, search for it and confirm from the provider's
   own site before writing it down. A wrong URL that looks plausible costs more time
   than saying "I could not find this".
2. **Check the licence and the redistribution terms for every dataset**, and record
   them. Some Indian government data is viewable but not redistributable. Write the
   licence into the dataset's README.
3. **Record provenance for everything you download**: source URL, access date,
   version or product ID, spatial extent, temporal extent, native CRS and
   resolution. Put it in a `README.md` beside the files.
4. **Do not fabricate the data itself under any circumstances.** If a real dataset
   is unavailable, say so. Synthetic stand-ins are acceptable only when they are
   clearly labelled as synthetic in both the filename and the README, because this
   project has already been burned by fabricated values reaching the UI.
5. **Report what you could not get, and why.** An honest gap list is a deliverable.
6. Verify each file opens and covers the stated area before declaring it done.

## What the project already has — do not re-download

- **Rainfall**: NASA GPM IMERG, 2025-06-20 to 2025-09-30, 4944 half-hourly frames,
  all-India, 0.1 degree. In `dataset/IMERG india/`. Complete and contiguous.
- **Terrain**: ISRO Bhuvan CartoDEM 30 m, covering all three city areas. Derived
  slope, D8 flow direction, flow accumulation and depression rasters are in
  `data/processed/`.

## Areas of interest

| City | Longitude | Latitude |
|---|---|---|
| Chennai | 80.10 to 80.45 | 12.90 to 13.30 |
| Mumbai | 72.75 to 72.95 | 18.90 to 19.10 |
| Delhi | 76.80 to 77.40 | 28.40 to 29.00 |

All outputs in **EPSG:4326** unless a gap says otherwise. Rasters as GeoTIFF,
vectors as GeoJSON or GeoPackage.

---

## Gap 1 — Observed flood extent and depth (HIGHEST PRIORITY)

**Why.** The flood-depth model is trained on a made-up formula. It has never seen a
real flood, so its depth predictions are unvalidated. This is the single thing
blocking the project from making a defensible claim. Nothing else on this list
matters as much.

**What is needed.** Either of these, in order of preference:

- **A.** Observed flood extent for real past events — Chennai 2015 and 2021,
  Mumbai 2005 and 2017 are the well-documented ones. Satellite-derived water masks
  from before/during/after each event. This gives *extent*, not depth, which turns
  the problem into "will this area flood, yes or no". That is a weaker target than
  depth but it is **real**, which the current target is not.
- **B.** Recorded water depths — municipal flood reports, inundation surveys, press
  or insurance records with specific locations and depths. Rarer and usually
  unstructured, but depth is what the model actually claims to predict.

**Where to look.** Verify each before using:

- **Copernicus Sentinel-1 SAR** — radar sees through cloud, which optical sensors
  cannot during a monsoon flood. This is the standard source for flood mapping.
  Access via the Copernicus Data Space Ecosystem. Free, registration required.
- **Global Flood Database** and the **Dartmouth Flood Observatory** — both publish
  historical flood event footprints; check whether their Indian events overlap the
  areas above.
- **ISRO Bhuvan / NRSC** — publishes flood hazard and inundation layers for India.
  Check what exists for these cities and what the download terms are.
- **Sentinel Hub** and **Google Earth Engine** — both can produce Sentinel-1 water
  masks without bulk downloading. Earth Engine needs an account.

**Done when.** For at least one real flood event in one city: a water/no-water
raster or polygon covering the AOI, matched to a date, with the pre-event baseline
so permanent water is distinguishable from flooding. Provenance recorded.

**Note on the alternative.** If no usable observation is found, the fallback is to
*generate* targets with a hydrodynamic solver (SFINCS from Deltares, or LISFLOOD-FP)
run over the CartoDEM already in the repo. That is simulation, not observation, and
must be labelled as such — but it is physics rather than an invented formula, so it
is a real step up. Report whether these solvers are installable and what input they
need.

## Gap 2 — Land cover / surface imperviousness

**Why.** Imperviousness is currently **fabricated on both sides**: training draws it
from `rng.uniform(45, 95)`, and serving uses one hardcoded number per city (Chennai
65%, Mumbai 75%, Delhi 60%). Nobody measured these. It is a model input, so this is
invented data feeding a prediction.

**What is needed.** A land-cover or impervious-surface raster covering each AOI, at
30 m or finer, convertible to percent impervious per pixel.

**Where to look.**

- **ESA WorldCover** — 10 m global land cover, free and openly licensed. Likely the
  best fit. Confirm the current release year.
- **Bhuvan LULC** — ISRO's land use / land cover for India; check resolution and
  terms.
- **Copernicus Global Land Service** and **ESRI / Dynamic World** land cover — check
  licence before use.
- **OpenStreetMap landuse polygons** — a usable crude fallback when nothing else is
  available, but note it is volunteer-mapped and uneven in coverage.

**Done when.** `data/raw/landcover/{city}_landcover.tif` exists for each city,
aligned to or resamplable onto the existing 30 m DEM grid, with a documented mapping
from land-cover class to percent impervious. Record where that mapping came from —
do not invent the percentages.

## Gap 3 — Higher-resolution rainfall (radar)

**Why.** IMERG is 11 km pixels every 30 minutes. A storm cell that floods one ward
is 2 to 5 km across and changes in about 10 minutes, so it is smaller than one pixel
and faster than one frame. The forecasting code is fine; it is being starved by the
input. This is the only change that would materially raise forecast skill.

**What is needed.** Doppler weather radar reflectivity or rain rate for Chennai, at
roughly 1 km and 10 minutes, ideally covering the same June–September 2025 window as
the IMERG archive so the two can be scored against each other.

**Where to look.**

- **India Meteorological Department (IMD)** — operates Doppler Weather Radars
  including one serving Chennai, and publishes radar imagery. Determine whether
  *gridded numerical data* is available, not just rendered images — a PNG of a radar
  sweep is not usable as model input. This distinction matters and is the likely
  sticking point.
- **MOSDAC (ISRO/SAC)** — hosts Indian meteorological satellite and related
  products. Registration required.
- **IMD's data supply portal** — bulk or archive data may require a formal request
  or a fee. Find out the actual procedure and report it, including cost and lead
  time, rather than guessing.

**Done when.** Either a sample of gridded radar data covering the Chennai AOI with
documented format and access route, **or** a clear written finding that gridded
radar is not obtainable, naming what was tried and what the barrier was. The second
outcome is a legitimate result — record it so nobody repeats the search.

## Gap 4 — Road network

**Why.** The project has no routing. There is a `roads` table and an endpoint that
filters road segments by flood depth, but no road graph was ever loaded, so it
returns nothing.

**What is needed.** Road centrelines for each AOI with road class, as a routable
graph.

**Where to look.**

- **OpenStreetMap**, via **Geofabrik** regional extracts (pre-cut by region, easiest
  for bulk) or the **Overpass API** (good for a small bounding box). `osmnx` will
  pull an OSM road network straight into a routable NetworkX graph in a few lines —
  check it is still maintained and note the version used.

**Done when.** `data/raw/roads/{city}_roads.geojson` exists with geometry, name and
road class, loadable as a connected graph, and a note of the OSM extract date.

## Gap 5 — Drainage and ward boundaries

**Why.** The drainage network is currently derived purely from terrain (D8 flow over
the DEM). Real cities drain through built storm-water infrastructure that does not
follow surface topography. Ward boundaries are needed so predictions can be reported
per administrative unit instead of per pixel.

**What is needed.** Storm-water drain alignments and municipal ward boundary
polygons.

**Where to look.**

- **Greater Chennai Corporation**, **Municipal Corporation of Greater Mumbai**,
  **Delhi municipal bodies** — check their open-data portals for drain and ward
  layers.
- **data.gov.in** — India's national open data portal.
- **OpenStreetMap** — often has `waterway=drain` and administrative boundary
  relations, with uneven coverage.

**Done when.** Ward boundary polygons for at least Chennai, with ward names matching
those already in the project's ward registry (`server/main.py`, `METRO_REGISTRY`) or
with an explicit mapping table where the names differ. Drains are a bonus — report
honestly if no authoritative source is published.

---

## Output expected from you

1. Each dataset downloaded into its own directory under `data/raw/`, with a
   `README.md` giving source URL, access date, licence, version, extent and CRS.
2. A single summary table: gap, status (obtained / partial / unavailable), source,
   licence, and what remains.
3. For anything unavailable: what you tried, what blocked it, and whether there is a
   formal request process worth starting.
4. **Do not modify model or application code.** Acquire and document data only;
   wiring it in is a separate task with its own review.
