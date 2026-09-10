# GIS & Dashboard UX Invariants

1. **No Routine Navigation Toasts**:
   - Never fire toast notifications or flash banners for ordinary user actions (e.g. switching cities, wards, tabs, or basemap styles). Navigation must be immediate, quiet, and fluid.
   - Reserve toasts exclusively for explicit operations (e.g. "Simulation Complete", "SitRep Copied", or asynchronous background errors).

2. **Audio Restraint & Opt-In Defaults**:
   - Audio alert synthesizers (`AudioContext`) must be muted (`soundEnabled: false`) by default.
   - Never tie audio chimes to periodic polling intervals (`setInterval`), background telemetry syncs, or routine UI clicks.
   - Audio cues must only play if explicitly enabled by the user and reserved for urgent life-safety threshold violations.

3. **Layman-First Presentation with Dedicated Professional Telescoping**:
   - Default map and card views must be intuitive to a citizen with zero domain knowledge:
     - Use intuitive traffic-light color grading (🟢 High Safe Ground, 🟡 Mid Slope, 🔴 Low Sink Basin).
     - Explain physical mechanics with clear rules of thumb (e.g. "Rainwater naturally flows from high ground downhill into lower basins").
   - Detailed engineering, geodetic, or government data (e.g. EPSG datums, MSL elevation numbers, hydraulic head $\Delta H$, Manning's roughness, runoff coefficients) must be tucked behind dedicated action buttons (e.g. "📐 Engineering GIS Specs" or "🏛️ Official Govt Data") in a dedicated modal or drawer.
