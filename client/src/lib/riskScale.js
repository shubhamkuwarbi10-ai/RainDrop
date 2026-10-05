/* @jsx React.createElement */
// ============================================================================
// One risk scale, one place.
//
// Before this file the 15-30 cm band was blue on the map and amber in the
// popup, "Critical" shared a colour with "High", and flood polygons were
// distinguished by colour alone. There were 73 distinct hex colours and four
// greys across the app.
//
// The scale below is ordered and monotonic in lightness, so it survives
// greyscale printing and the common colour-vision deficiencies. Every band also
// carries a short text label and a hatch pattern id, because colour must never
// be the only carrier of meaning (WCAG 1.4.1).
// ============================================================================

const RISK_BANDS = [
    {
        key: "dry",
        maxDepthCm: 5,
        label: "Dry",
        plain: "Road is clear",
        depthText: "under 5 cm",
        hex: "#6b7280",          // grey-500
        fill: "#9ca3af",
        text: "#374151",
        bg: "#f3f4f6",
        border: "#d1d5db",
        hatch: "none",
        order: 0,
    },
    {
        key: "shallow",
        maxDepthCm: 15,
        label: "Shallow",
        plain: "Ankle deep",
        depthText: "5 to 15 cm",
        hex: "#eab308",          // yellow-500
        fill: "#fde047",
        text: "#854d0e",
        bg: "#fefce8",
        border: "#fde047",
        hatch: "dots",
        order: 1,
    },
    {
        key: "moderate",
        maxDepthCm: 30,
        label: "Moderate",
        plain: "Ankle to shin deep",
        depthText: "15 to 30 cm",
        hex: "#f97316",          // orange-500
        fill: "#fb923c",
        text: "#9a3412",
        bg: "#fff7ed",
        border: "#fdba74",
        hatch: "diagonal",
        order: 2,
    },
    {
        key: "deep",
        maxDepthCm: 60,
        label: "Deep",
        plain: "Knee to waist deep",
        depthText: "30 to 60 cm",
        hex: "#dc2626",          // red-600
        fill: "#ef4444",
        text: "#991b1b",
        bg: "#fef2f2",
        border: "#fca5a5",
        hatch: "crosshatch",
        order: 3,
    },
    {
        key: "severe",
        maxDepthCm: Infinity,
        label: "Severe",
        plain: "Waist deep or more",
        depthText: "over 60 cm",
        hex: "#7f1d1d",          // red-900
        fill: "#991b1b",
        text: "#7f1d1d",
        bg: "#fef2f2",
        border: "#991b1b",
        hatch: "solid",
        order: 4,
    },
];

/** Band for a water depth in centimetres. */
function bandForDepth(depthCm) {
    const depth = Number.isFinite(depthCm) ? Math.max(0, depthCm) : 0;
    return RISK_BANDS.find((band) => depth < band.maxDepthCm) || RISK_BANDS[RISK_BANDS.length - 1];
}

// Backend risk names map onto the same ordered scale, so a risk level and a
// depth never disagree about which colour to use.
const RISK_LEVEL_TO_BAND = {
    NONE: "dry",
    LOW: "shallow",
    MODERATE: "moderate",
    HIGH: "deep",
    SEVERE: "severe",
    UNKNOWN: "dry",
};

function bandForRiskLevel(riskLevel) {
    const key = RISK_LEVEL_TO_BAND[String(riskLevel || "").toUpperCase().trim()] || "dry";
    return RISK_BANDS.find((band) => band.key === key) || RISK_BANDS[0];
}

/** Tailwind classes for a badge, derived from one band so they cannot drift. */
function bandBadgeClass(band) {
    return {
        dry: "text-slate-700 bg-slate-100 border-slate-300",
        shallow: "text-yellow-900 bg-yellow-50 border-yellow-400",
        moderate: "text-orange-900 bg-orange-50 border-orange-400",
        deep: "text-red-900 bg-red-50 border-red-400",
        severe: "text-red-50 bg-red-900 border-red-900",
    }[band.key];
}

// ============================================================================
// Data provenance
// ============================================================================

const DATA_STATUS_META = {
    live: {
        label: "Live",
        plain: "Updated from the weather provider just now.",
        dot: "bg-emerald-600",
        chip: "text-emerald-900 bg-emerald-50 border-emerald-300",
    },
    heuristic: {
        label: "Estimate",
        plain: "Calculated from a formula, not a validated model.",
        dot: "bg-sky-600",
        chip: "text-sky-900 bg-sky-50 border-sky-300",
    },
    demo: {
        label: "Demo",
        plain: "Sample content. Not derived from live data.",
        dot: "bg-violet-600",
        chip: "text-violet-900 bg-violet-50 border-violet-300",
    },
    unavailable: {
        label: "No data",
        plain: "No trustworthy value is available.",
        dot: "bg-slate-500",
        chip: "text-slate-700 bg-slate-100 border-slate-300",
    },
    stale: {
        label: "Stale",
        plain: "The last successful update is more than 10 minutes old.",
        dot: "bg-amber-600",
        chip: "text-amber-900 bg-amber-50 border-amber-400",
    },
    offline: {
        label: "Offline",
        plain: "The server cannot be reached. Figures on screen are not current.",
        dot: "bg-red-700",
        chip: "text-red-50 bg-red-700 border-red-800",
    },
};

function statusMeta(status) {
    return DATA_STATUS_META[String(status || "unavailable").toLowerCase()] || DATA_STATUS_META.unavailable;
}

/**
 * Feed state from the fetch result, not from the wall clock.
 *
 * The old badge showed a ticking clock and stayed green whether or not data
 * had arrived, so an operator could dispatch pumps from stale or mock numbers
 * and never know.
 */
const STALE_AFTER_MS = 10 * 60 * 1000;

function feedState({ lastSuccessAt, lastErrorAt, serverStatus }) {
    if (!lastSuccessAt) return "offline";
    const age = Date.now() - lastSuccessAt;
    if (lastErrorAt && lastErrorAt > lastSuccessAt && age > STALE_AFTER_MS) return "offline";
    if (age > STALE_AFTER_MS) return "stale";
    if (lastErrorAt && lastErrorAt > lastSuccessAt) return "stale";
    return serverStatus || "live";
}

/** "14:52" for a timestamp, or a dash when there is nothing to show. */
function clockLabel(timestamp) {
    if (!timestamp) return "--:--";
    const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(String(timestamp));
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** "4 min ago", for showing the age of the data rather than the current time. */
function ageLabel(timestamp) {
    if (!timestamp) return "never";
    const seconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.round(minutes / 60)} h ago`;
}

// ============================================================================
// Safety
// ============================================================================

/**
 * Escape a value for interpolation into a Leaflet popup.
 *
 * Popups are built as HTML strings. Today the names come from a local table, so
 * nothing is injectable; the moment they come from the API or a citizen report,
 * an unescaped name is stored XSS. Escaping now costs nothing.
 */
function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
