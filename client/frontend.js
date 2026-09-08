/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
// Global references — loaded via UMD scripts in index.html
const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;

// Safe Lucide icon accessor helper to guarantee no icon is ever undefined
const getIcon = (name, fallbackChildren) => {
  try {
    if (window.LucideReact && window.LucideReact[name]) return window.LucideReact[name];
    if (window.lucideReact && window.lucideReact[name]) return window.lucideReact[name];
    if (window.lucide && window.lucide[name]) return window.lucide[name];
  } catch (_) {}
  return function SafeIcon(props) {
    return /*#__PURE__*/React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      width: props.size || props.width || 16,
      height: props.size || props.height || 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: props.className || ""
    }, fallbackChildren || /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "8"
    }));
  };
};
const CloudRain = getIcon("CloudRain");
const Layers = getIcon("Layers");
const Activity = getIcon("Activity");
const Navigation = getIcon("Navigation");
const Server = getIcon("Server");
const CheckCircle2 = getIcon("CheckCircle2");
const Radio = getIcon("Radio");
const MapPin = getIcon("MapPin");
const Play = getIcon("Play");
const Pause = getIcon("Pause");
const X = getIcon("X");
const Clock = getIcon("Clock");
const Droplets = getIcon("Droplets");
const ChevronDown = getIcon("ChevronDown");
const ChevronUp = getIcon("ChevronUp");
const ArrowLeft = getIcon("ArrowLeft");
const Waves = getIcon("Waves");
const AlertTriangle = getIcon("AlertTriangle");
const Gauge = getIcon("Gauge");
const Wifi = getIcon("Wifi");
const ArrowRight = getIcon("ArrowRight");
const ShieldCheck = getIcon("ShieldCheck");
const TrendingUp = getIcon("TrendingUp");
const Sparkles = getIcon("Sparkles");
const Sliders = getIcon("Sliders");
const Volume2 = getIcon("Volume2");
const VolumeX = getIcon("VolumeX");
const FileText = getIcon("FileText");
const Compass = getIcon("Compass");
const Zap = getIcon("Zap");
const Info = getIcon("Info");
const Car = getIcon("Car");
const AlertOctagon = getIcon("AlertOctagon");
const Eye = getIcon("Eye");
const RefreshCw = getIcon("RefreshCw");
const Maximize2 = getIcon("Maximize2");
const ShieldAlert = getIcon("ShieldAlert");
const Send = getIcon("Send");
const Building2 = getIcon("Building2");
const Cpu = getIcon("Cpu");
const CornerDownRight = getIcon("CornerDownRight");
const Check = getIcon("Check");
const Crosshair = getIcon("Crosshair");
const Printer = getIcon("Printer");
const Copy = getIcon("Copy");
const Power = getIcon("Power");
const EyeOff = getIcon("EyeOff");
const Route = getIcon("Route", /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
  cx: "6",
  cy: "19",
  r: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "18",
  cy: "5",
  r: "3"
})));

// ============================================================================
// Static Configuration & Data
// ============================================================================

const WARDS_DATA = {
  "Kurla West": {
    code: "Ward 184-L",
    name: "Kurla West",
    riskLevel: "HIGH RISK",
    riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    riverName: "Mithi River Corridor",
    riverLevel: 3.42,
    // meters
    dangerLevel: 3.80,
    rainfallForecast: "54 mm",
    activePumps: "10 / 12",
    evacShelters: "4 Active (62% cap)",
    sectors: [{
      id: 0,
      name: "LBS Marg - Sheetal Jn",
      baseDepth: 18,
      elevation: 6.2,
      coords: "19.068, 72.879"
    }, {
      id: 1,
      name: "Bail Bazar Nullah",
      baseDepth: 42,
      elevation: 4.8,
      coords: "19.071, 72.884"
    }, {
      id: 2,
      name: "Kurla Station West Subway",
      baseDepth: 36,
      elevation: 5.1,
      coords: "19.065, 72.882"
    }, {
      id: 3,
      name: "Kranti Nagar Lowland",
      baseDepth: 48,
      elevation: 4.3,
      coords: "19.062, 72.887"
    }, {
      id: 4,
      name: "CST Road Bridge Ramp",
      baseDepth: 12,
      elevation: 8.4,
      coords: "19.074, 72.873"
    }, {
      id: 5,
      name: "BKC Link Connector",
      baseDepth: 4,
      elevation: 9.8,
      coords: "19.060, 72.868"
    }, {
      id: 6,
      name: "Taximens Colony Gate",
      baseDepth: 28,
      elevation: 5.5,
      coords: "19.076, 72.880"
    }, {
      id: 7,
      name: "Kamani Industrial Jn",
      baseDepth: 32,
      elevation: 5.3,
      coords: "19.078, 72.886"
    }, {
      id: 8,
      name: "Phoenix Mall Access Rd",
      baseDepth: 8,
      elevation: 7.9,
      coords: "19.083, 72.888"
    }, {
      id: 9,
      name: "Halav Pool Causeway",
      baseDepth: 38,
      elevation: 4.9,
      coords: "19.064, 72.885"
    }, {
      id: 10,
      name: "Kalina CST Flyover",
      baseDepth: 0,
      elevation: 12.1,
      coords: "19.072, 72.865"
    }, {
      id: 11,
      name: "Sunder Nagar Culvert",
      baseDepth: 26,
      elevation: 5.8,
      coords: "19.070, 72.876"
    }, {
      id: 12,
      name: "Jarimari Hillside Runoff",
      baseDepth: 22,
      elevation: 8.1,
      coords: "19.082, 72.878"
    }, {
      id: 13,
      name: "Mithi River Retention Wall",
      baseDepth: 44,
      elevation: 4.4,
      coords: "19.063, 72.878"
    }, {
      id: 14,
      name: "Kapadia Nagar Culvert",
      baseDepth: 14,
      elevation: 6.9,
      coords: "19.069, 72.871"
    }, {
      id: 15,
      name: "SG Barve Marg Cross",
      baseDepth: 16,
      elevation: 6.7,
      coords: "19.066, 72.889"
    }, {
      id: 16,
      name: "New Kurla Depot Area",
      baseDepth: 24,
      elevation: 5.9,
      coords: "19.061, 72.883"
    }, {
      id: 17,
      name: "Brahmanwadi Sump",
      baseDepth: 34,
      elevation: 5.0,
      coords: "19.067, 72.887"
    }, {
      id: 18,
      name: "Premier Compound West",
      baseDepth: 10,
      elevation: 7.5,
      coords: "19.079, 72.882"
    }, {
      id: 19,
      name: "Kajupada Low Creek",
      baseDepth: 30,
      elevation: 5.4,
      coords: "19.085, 72.876"
    }, {
      id: 20,
      name: "Air India Colony Spur",
      baseDepth: 6,
      elevation: 8.9,
      coords: "19.075, 72.868"
    }, {
      id: 21,
      name: "Old Agra Road Jcn",
      baseDepth: 20,
      elevation: 6.3,
      coords: "19.073, 72.882"
    }, {
      id: 22,
      name: "Pipe Road Drainage Box",
      baseDepth: 40,
      elevation: 4.7,
      coords: "19.066, 72.885"
    }, {
      id: 23,
      name: "Kohinoor City Elevated",
      baseDepth: 2,
      elevation: 11.0,
      coords: "19.071, 72.877"
    }]
  },
  "Kurla East": {
    code: "Ward 185-L",
    name: "Kurla East",
    riskLevel: "MODERATE RISK",
    riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    riverName: "Eastern Nullah Trunk",
    riverLevel: 2.30,
    dangerLevel: 3.20,
    rainfallForecast: "38 mm",
    activePumps: "8 / 8",
    evacShelters: "3 Active (41% cap)",
    sectors: [{
      id: 0,
      name: "Nehru Nagar Bus Station",
      baseDepth: 22,
      elevation: 6.1,
      coords: "19.061, 72.894"
    }, {
      id: 1,
      name: "Kasaiwada Nullah",
      baseDepth: 34,
      elevation: 4.9,
      coords: "19.058, 72.890"
    }, {
      id: 2,
      name: "Shiv Shrishti Complex",
      baseDepth: 10,
      elevation: 7.8,
      coords: "19.064, 72.897"
    }, {
      id: 3,
      name: "Tilak Nagar Station North",
      baseDepth: 26,
      elevation: 5.6,
      coords: "19.068, 72.899"
    }, {
      id: 4,
      name: "Kamgar Nagar Culvert",
      baseDepth: 18,
      elevation: 6.4,
      coords: "19.065, 72.892"
    }, {
      id: 5,
      name: "Eastern Express Highway Rmp",
      baseDepth: 4,
      elevation: 9.5,
      coords: "19.070, 72.905"
    }, {
      id: 6,
      name: "Chunabhatti Rail Subway",
      baseDepth: 32,
      elevation: 5.1,
      coords: "19.052, 72.888"
    }, {
      id: 7,
      name: "Mother Dairy Lowlands",
      baseDepth: 14,
      elevation: 7.0,
      coords: "19.063, 72.896"
    }]
  },
  "Chembur": {
    code: "Ward 152-M",
    name: "Chembur",
    riskLevel: "MODERATE RISK",
    riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    riverName: "Mahul Creek Drainage",
    riverLevel: 2.10,
    dangerLevel: 3.10,
    rainfallForecast: "34 mm",
    activePumps: "7 / 8",
    evacShelters: "2 Active (35% cap)",
    sectors: [{
      id: 0,
      name: "Postal Colony Low Area",
      baseDepth: 28,
      elevation: 5.4,
      coords: "19.055, 72.902"
    }, {
      id: 1,
      name: "Shell Colony Nullah",
      baseDepth: 30,
      elevation: 5.2,
      coords: "19.052, 72.906"
    }, {
      id: 2,
      name: "Amar Mahal Jn Underpass",
      baseDepth: 36,
      elevation: 4.8,
      coords: "19.072, 72.902"
    }, {
      id: 3,
      name: "Diamond Garden Circle",
      baseDepth: 6,
      elevation: 8.7,
      coords: "19.050, 72.899"
    }, {
      id: 4,
      name: "Sion-Trombay Highway Cross",
      baseDepth: 12,
      elevation: 7.2,
      coords: "19.059, 72.912"
    }, {
      id: 5,
      name: "Chembur Naka Market",
      baseDepth: 16,
      elevation: 6.8,
      coords: "19.054, 72.904"
    }]
  },
  "Vikhroli": {
    code: "Ward 121-S",
    name: "Vikhroli",
    riskLevel: "LOW RISK",
    riskColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    riverName: "Thane Creek Spillway",
    riverLevel: 1.65,
    dangerLevel: 3.50,
    rainfallForecast: "22 mm",
    activePumps: "6 / 6",
    evacShelters: "2 Standby (18% cap)",
    sectors: [{
      id: 0,
      name: "Godrej Creek Basin",
      baseDepth: 14,
      elevation: 6.5,
      coords: "19.102, 72.930"
    }, {
      id: 1,
      name: "Tagore Nagar Sector 3",
      baseDepth: 18,
      elevation: 6.1,
      coords: "19.106, 72.925"
    }, {
      id: 2,
      name: "LBS Marg Vikhroli West",
      baseDepth: 8,
      elevation: 8.2,
      coords: "19.112, 72.918"
    }, {
      id: 3,
      name: "Kannamwar Nagar Depot",
      baseDepth: 12,
      elevation: 7.0,
      coords: "19.108, 72.933"
    }, {
      id: 4,
      name: "Kanjurmarg South Sump",
      baseDepth: 10,
      elevation: 7.4,
      coords: "19.120, 72.928"
    }]
  },
  "Andheri West": {
    code: "Ward 064-K",
    name: "Andheri West",
    riskLevel: "HIGH RISK",
    riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    riverName: "Oshiwara River Basin",
    riverLevel: 3.15,
    dangerLevel: 3.60,
    rainfallForecast: "46 mm",
    activePumps: "11 / 14",
    evacShelters: "5 Active (74% cap)",
    sectors: [{
      id: 0,
      name: "Milan Subway Lower Point",
      baseDepth: 46,
      elevation: 4.2,
      coords: "19.104, 72.842"
    }, {
      id: 1,
      name: "SV Road Shoppers Stop Jn",
      baseDepth: 28,
      elevation: 5.8,
      coords: "19.118, 72.844"
    }, {
      id: 2,
      name: "Veera Desai Industrial Drain",
      baseDepth: 34,
      elevation: 5.2,
      coords: "19.135, 72.833"
    }, {
      id: 3,
      name: "Gilbert Hill Foothill Runoff",
      baseDepth: 22,
      elevation: 6.7,
      coords: "19.121, 72.838"
    }, {
      id: 4,
      name: "DN Nagar Metro Depot",
      baseDepth: 10,
      elevation: 8.1,
      coords: "19.126, 72.831"
    }, {
      id: 5,
      name: "Lokhandwala Back Road",
      baseDepth: 16,
      elevation: 7.0,
      coords: "19.141, 72.825"
    }]
  }
};
const WARDS = Object.keys(WARDS_DATA);

// Web Audio synthesizer for alert notifications
function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch {
    // audio context muted/blocked
  }
}

// Hydrograph forecast timeline data
const HYDROGRAPH_DATA = [{
  t: "T-1h",
  rain: 18,
  surge: 1.8,
  label: "11:45 AM"
}, {
  t: "T+0h",
  rain: 36,
  surge: 2.6,
  label: "12:45 PM (Now)"
}, {
  t: "T+1h",
  rain: 52,
  surge: 3.4,
  label: "01:45 PM"
}, {
  t: "T+2h",
  rain: 44,
  surge: 3.8,
  label: "02:45 PM (Peak)"
}, {
  t: "T+3h",
  rain: 26,
  surge: 3.2,
  label: "03:45 PM"
}, {
  t: "T+4h",
  rain: 14,
  surge: 2.5,
  label: "04:45 PM"
}, {
  t: "T+6h",
  rain: 8,
  surge: 1.9,
  label: "06:45 PM"
}];

// Route definitions for interactive routing
const ROUTE_OPTIONS = [{
  id: "route-1",
  name: "Kurla West Depot → Kurla Railway Station",
  origin: "Kurla Depot",
  destination: "Kurla Station",
  standard: {
    dist: "1.8 km",
    time: "14 min",
    blocked: true,
    blockReason: "Subway submerged (44 cm water depth at Bail Bazar Nullah)",
    hazardLevel: "Critical - Road Closed",
    segments: [{
      name: "Depot Access Lane",
      depth: 12,
      safe: true
    }, {
      name: "Bail Bazar Nullah Causeway",
      depth: 44,
      safe: false
    }, {
      name: "Station West Approach",
      depth: 38,
      safe: false
    }]
  },
  safeRoute: {
    dist: "2.6 km",
    time: "19 min (+5m detour)",
    elevation: "8.5m avg ridge",
    hazardLevel: "Clear & Passable",
    corridor: "Via Kalina Flyover & Elevated Link",
    segments: [{
      name: "Depot Access Lane",
      depth: 12,
      safe: true
    }, {
      name: "Kalina CST Flyover Ramp",
      depth: 0,
      safe: true
    }, {
      name: "Kohinoor Elevated Spine",
      depth: 2,
      safe: true
    }, {
      name: "Station East Elevated Footbridge",
      depth: 4,
      safe: true
    }]
  }
}, {
  id: "route-2",
  name: "LBS Marg North → BKC Connector",
  origin: "LBS Marg North",
  destination: "BKC Connector",
  standard: {
    dist: "2.4 km",
    time: "18 min",
    blocked: true,
    blockReason: "Waterlogging at Kranti Nagar (48 cm) & Sheetal Cinema Jn",
    hazardLevel: "High Hazard - Stalled vehicles",
    segments: [{
      name: "LBS Marg Arterial",
      depth: 28,
      safe: false
    }, {
      name: "Sheetal Cinema Jn",
      depth: 34,
      safe: false
    }, {
      name: "BKC Ramp Lower Deck",
      depth: 16,
      safe: true
    }]
  },
  safeRoute: {
    dist: "3.1 km",
    time: "22 min (+4m detour)",
    elevation: "11.2m avg ridge",
    hazardLevel: "Clear & Passable",
    corridor: "Via Air India Colony Ridge & CST Upper Bridge",
    segments: [{
      name: "Air India Colony Ridge",
      depth: 4,
      safe: true
    }, {
      name: "CST Upper Bridge Ramp",
      depth: 0,
      safe: true
    }, {
      name: "BKC Flyover Direct Link",
      depth: 0,
      safe: true
    }]
  }
}];

// ============================================================================
// Small Reusable Components
// ============================================================================

function ToastStack({
  toasts
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed bottom-5 right-5 z-[80] flex flex-col gap-2 items-end pointer-events-none"
  }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: "flex items-center gap-2.5 rounded-xl border border-indigo-500/30 bg-[#161a29]/95 backdrop-blur-md px-4 py-2.5 shadow-2xl shadow-indigo-950/60 text-slate-100 animate-in fade-in slide-in-from-bottom-3 duration-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium"
  }, t.msg))));
}
function StatusPill({
  busy,
  label = "Ready"
}) {
  if (busy) {
    return /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-medium text-indigo-300"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"
    }), "Processing…");
  }
  return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-1.5 h-1.5 rounded-full bg-emerald-400"
  }), label);
}
function ToggleRow({
  label,
  checked,
  onChange
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onChange,
    className: "w-full flex items-center justify-between py-2 group cursor-pointer",
    type: "button"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-300 group-hover:text-white transition-colors"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: `relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${checked ? "bg-indigo-600" : "bg-slate-700/80"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${checked ? "translate-x-4.5" : "translate-x-1"}`
  })));
}
function WaterDepthWave({
  depth,
  maxDepth = 60
}) {
  const percentage = Math.min(100, Math.max(5, depth / maxDepth * 100));
  const color = depth < 15 ? "#10b981" : depth < 30 ? "#f59e0b" : "#f43f5e";
  return /*#__PURE__*/React.createElement("div", {
    className: "relative w-full h-24 rounded-xl overflow-hidden bg-slate-900/90 border border-slate-700/60 flex items-end"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20"
  }, /*#__PURE__*/React.createElement("div", {
    className: "border-b border-dashed border-slate-400 text-[9px] font-mono text-slate-400"
  }, "60cm critical"), /*#__PURE__*/React.createElement("div", {
    className: "border-b border-dashed border-slate-400 text-[9px] font-mono text-slate-400"
  }, "30cm warning"), /*#__PURE__*/React.createElement("div", {
    className: "text-[9px] font-mono text-slate-400"
  }, "0cm clear")), /*#__PURE__*/React.createElement("div", {
    className: "w-full transition-all duration-700 relative overflow-hidden",
    style: {
      height: `${percentage}%`,
      backgroundColor: color,
      opacity: 0.75
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 right-0 h-3 opacity-80",
    style: {
      background: `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.6) 0%, transparent 80%)`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex items-center justify-center pointer-events-none"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-bold font-mono tracking-tight text-white"
  }, depth, " cm"), /*#__PURE__*/React.createElement("span", {
    className: "block text-[9px] uppercase tracking-wider text-slate-400"
  }, depth < 15 ? "Low / Passable" : depth < 30 ? "Moderate Inundation" : "Submerged / Impassable"))));
}

// ============================================================================
// Main Application Component
// ============================================================================

function RainDrop() {
  const [view, setView] = useState("command"); // 'command' | 'hero'
  const [activeTab, setActiveTab] = useState("telemetry"); // 'telemetry' | 'routes' | 'scenario' | 'map'
  const [ward, setWard] = useState("Kurla West");
  const [wardOpen, setWardOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sitRepOpen, setSitRepOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);

  // Map Enable Toggle State (Default enabled for live map API display)
  const [isMapEnabled, setIsMapEnabled] = useState(true);
  const [isDashboardMinimized, setIsDashboardMinimized] = useState(false);
  const toastId = useRef(0);

  // Time Machine State
  const [timeStep, setTimeStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);

  // Dynamic Live Forecast & Hydrograph State
  const [hydrograph, setHydrograph] = useState(HYDROGRAPH_DATA);
  const [liveForecast, setLiveForecast] = useState(null);
  const [isFetchingForecast, setIsFetchingForecast] = useState(false);

  // Layer Controls
  const [layers, setLayers] = useState({
    heatmap: true,
    sensors: true,
    pumps: true,
    shelters: true,
    safeCorridor: true,
    elevationContours: false
  });

  // What-If Scenario Sliders
  const [scenario, setScenario] = useState({
    rainfallMultiplier: 1.0,
    tideOffset: 0,
    pumpEfficiency: 100
  });

  // Routing Simulator State
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [isSimulatingRoute, setIsSimulatingRoute] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);

  // Backend Feeds State
  const [radarBusy, setRadarBusy] = useState(false);
  const [terrainBusy, setTerrainBusy] = useState(false);
  const [simBusy, setSimBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [mlCorrection, setMlCorrection] = useState(true);
  const [soilMoisture, setSoilMoisture] = useState(true);
  const [coupling, setCoupling] = useState(true);
  const [radarTime, setRadarTime] = useState("12:45 PM");
  const [latency, setLatency] = useState(11);
  const [updatedAgo, setUpdatedAgo] = useState(1);

  // --- Telemetry Status ---
  const [telemetry, setTelemetry] = useState(null);

  // --- Nowcast ---
  const [nowcastBusy, setNowcastBusy] = useState(false);
  const [nowcastResult, setNowcastResult] = useState(null);

  // --- Route Check Form ---
  const [routeCheckOpen, setRouteCheckOpen] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState("");
  const [routeDest, setRouteDest] = useState("");
  const [routeDepth, setRouteDepth] = useState(0);
  const [routeCheckBusy, setRouteCheckBusy] = useState(false);
  const [routeCheckResult, setRouteCheckResult] = useState(null);
  const pushToast = msg => {
    const id = ++toastId.current;
    setToasts(t => [...t, {
      id,
      msg
    }]);
    if (soundEnabled) playAlertChime();
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  };

  // Fetch Live ML Ward Forecast from FastAPI Backend
  useEffect(() => {
    async function loadWardForecast() {
      setIsFetchingForecast(true);
      try {
        const res = await fetch(`/api/ward_forecast?ward_name=${encodeURIComponent(ward)}`);
        if (res.ok) {
          const data = await res.json();
          setLiveForecast(data);
          if (data.prediction && data.prediction.timeseries_mm_hr && data.prediction.timeseries_mm_hr.length > 0) {
            const newHydro = data.prediction.timeseries_mm_hr.slice(0, 7).map((val, idx) => ({
              t: data.prediction.timeseries_labels[idx] || `T+${idx}h`,
              rain: Math.round(val * 10) / 10,
              surge: Number((1.5 + val * 0.04).toFixed(1)),
              label: data.prediction.timeseries_labels[idx] || `Horizon +${idx}h`
            }));
            setHydrograph(newHydro);
          }
          pushToast(`Live ML forecast sync complete for ${ward} (${data.source || 'FastAPI'})`);
        }
      } catch (err) {
        console.warn("Backend API sync offline, using local model state:", err);
      } finally {
        setIsFetchingForecast(false);
      }
    }
    loadWardForecast();
  }, [ward]);

  // --- Telemetry Polling (every 30 s) ---
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/telemetry_status");
        if (res.ok) setTelemetry(await res.json());
      } catch (_) {}
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setUpdatedAgo(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeStep(prev => prev >= hydrograph.length - 1 ? 0 : prev + 1);
    }, 2400 / playSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, hydrograph]);
  useEffect(() => {
    if (!isSimulatingRoute) return;
    setRouteProgress(0);
    const interval = setInterval(() => {
      setRouteProgress(p => {
        if (p >= 100) {
          setIsSimulatingRoute(false);
          pushToast("Vehicle arrived safely via elevation bypass corridor");
          return 100;
        }
        return p + 5;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isSimulatingRoute]);
  const currentWardData = useMemo(() => WARDS_DATA[ward] || WARDS_DATA["Kurla West"], [ward]);
  const sectorDepths = useMemo(() => {
    const livePeak = liveForecast && liveForecast.prediction && liveForecast.prediction.peak_intensity_mm_hr || 45;
    const rainRatio = livePeak / 45;
    const timeMultiplier = timeStep * 0.45 + 0.6;
    const rainFactor = scenario.rainfallMultiplier * (rainRatio > 0 ? rainRatio : 1.0);
    const tideFactor = 1 + scenario.tideOffset * 0.25;
    const pumpFactor = 1.3 - scenario.pumpEfficiency / 100 * 0.4;
    return currentWardData.sectors.map(sec => {
      const calc = Math.round(sec.baseDepth * timeMultiplier * rainFactor * tideFactor * pumpFactor - sec.elevation * 0.8);
      return Math.max(0, calc);
    });
  }, [currentWardData, timeStep, scenario, liveForecast]);
  const floodStats = useMemo(() => {
    let clear = 0;
    let caution = 0;
    let critical = 0;
    sectorDepths.forEach(d => {
      if (d < 15) clear++;else if (d < 30) caution++;else critical++;
    });
    return {
      clear,
      caution,
      critical
    };
  }, [sectorDepths]);
  const runAction = (setBusy, msg, after) => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      pushToast(msg);
      if (after) after();
    }, 900);
  };
  const handleEnableMap = () => {
    setIsMapEnabled(true);
    pushToast(`Spatial flood map activated for ${ward}`);
  };
  const handleDisableMap = () => {
    setIsMapEnabled(false);
    pushToast("Spatial map switched to Standby Mode");
  };

  // --- Nowcast API Call ---
  const handleRefreshNowcast = async () => {
    setNowcastBusy(true);
    setNowcastResult(null);
    try {
      const res = await fetch("/api/run_pipeline");
      const data = await res.json();
      setNowcastResult(data);
      pushToast(`Nowcast pipeline: ${data.status || "DONE"} — ${data.message || ""}`);
    } catch (err) {
      setNowcastResult({
        status: "ERROR",
        message: err.message
      });
      pushToast("Nowcast pipeline call failed — backend offline?");
    } finally {
      setNowcastBusy(false);
    }
  };

  // --- Route Check API Call ---
  const handleRouteCheck = async e => {
    e.preventDefault();
    if (!routeOrigin.trim() || !routeDest.trim()) return;
    setRouteCheckBusy(true);
    setRouteCheckResult(null);
    try {
      const params = new URLSearchParams({
        origin: routeOrigin,
        destination: routeDest,
        depth_cm: routeDepth
      });
      const res = await fetch(`/api/route_check?${params}`);
      const data = await res.json();
      setRouteCheckResult(data);
      pushToast(`Route safety check complete: ${data && data.standard_route && data.standard_route.status || "DONE"}`);
    } catch (err) {
      setRouteCheckResult({
        error: err.message
      });
      pushToast("Route check failed — backend offline?");
    } finally {
      setRouteCheckBusy(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen w-full bg-slate-100 text-slate-900 relative selection:bg-blue-600 selection:text-white font-sans"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pointer-events-none fixed inset-0 opacity-40",
    style: {
      background: "radial-gradient(circle 800px at 10% 0%, rgba(37, 99, 235, 0.08), transparent 70%), radial-gradient(circle 800px at 90% 20%, rgba(5, 150, 105, 0.08), transparent 70%)"
    }
  }), /*#__PURE__*/React.createElement(ToastStack, {
    toasts: toasts
  }), selectedSector !== null && /*#__PURE__*/React.createElement(SectorDrawer, {
    sector: currentWardData.sectors[selectedSector],
    depth: sectorDepths[selectedSector],
    wardName: ward,
    onClose: () => setSelectedSector(null),
    pushToast: pushToast
  }), routeCheckOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-[90] flex items-center justify-center p-4",
    style: {
      background: "rgba(15,23,42,0.6)",
      backdropFilter: "blur(6px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 text-slate-900"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setRouteCheckOpen(false);
      setRouteCheckResult(null);
    },
    className: "absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer",
    type: "button"
  }, /*#__PURE__*/React.createElement(X, {
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 mb-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600"
  }, /*#__PURE__*/React.createElement(Route, {
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-sm font-bold text-slate-900"
  }, "Route Safety Check"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-500 font-mono"
  }, "Powered by /api/route_check"))), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleRouteCheck,
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-[11px] font-semibold text-slate-600 mb-1"
  }, "Origin"), /*#__PURE__*/React.createElement("input", {
    value: routeOrigin,
    onChange: e => setRouteOrigin(e.target.value),
    placeholder: "e.g. Kurla Station West",
    required: true,
    className: "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-[11px] font-semibold text-slate-600 mb-1"
  }, "Destination"), /*#__PURE__*/React.createElement("input", {
    value: routeDest,
    onChange: e => setRouteDest(e.target.value),
    placeholder: "e.g. BKC Connector",
    required: true,
    className: "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-[11px] font-semibold text-slate-600 mb-1"
  }, "Current Water Depth (cm)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    max: "200",
    step: "1",
    value: routeDepth,
    onChange: e => setRouteDepth(Number(e.target.value)),
    className: "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: routeCheckBusy,
    className: "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
  }, routeCheckBusy ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(RefreshCw, {
    className: "w-3.5 h-3.5 animate-spin"
  }), " Checking…") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Send, {
    className: "w-3.5 h-3.5"
  }), " Check Route Safety"))), routeCheckResult && !routeCheckResult.error && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 space-y-2 border-t border-slate-100 pt-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: `flex items-center justify-between rounded-lg px-3 py-2 border ${routeCheckResult.standard_route && routeCheckResult.standard_route.status === "BLOCKED" ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold text-slate-700"
  }, "Standard Route"), /*#__PURE__*/React.createElement("span", {
    className: `text-[11px] font-bold ${routeCheckResult.standard_route && routeCheckResult.standard_route.status === "BLOCKED" ? "text-red-600" : "text-emerald-700"}`
  }, routeCheckResult.standard_route && routeCheckResult.standard_route.status)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between rounded-lg px-3 py-2 border bg-emerald-50 border-emerald-200"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold text-slate-700"
  }, "Safe Corridor"), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-bold text-emerald-700"
  }, routeCheckResult.safe_corridor && routeCheckResult.safe_corridor.status, " · +", routeCheckResult.safe_corridor && routeCheckResult.safe_corridor.detour_time_min, "min detour")), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-slate-500"
  }, routeCheckResult.safe_corridor && routeCheckResult.safe_corridor.hazard_level)), routeCheckResult && routeCheckResult.error && /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-xs text-red-600"
  }, routeCheckResult.error))), view === "hero" ? /*#__PURE__*/React.createElement(HeroView, {
    ward: ward,
    wardData: currentWardData,
    onEnter: () => {
      setView("command");
      setIsMapEnabled(true);
    }
  }) : /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 max-w-[1600px] mx-auto px-3 sm:px-6 py-4 flex flex-col min-h-screen"
  }, /*#__PURE__*/React.createElement(TopNavbar, {
    ward: ward,
    wardOpen: wardOpen,
    setWardOpen: setWardOpen,
    setWard: setWard,
    soundEnabled: soundEnabled,
    setSoundEnabled: setSoundEnabled,
    isMapEnabled: isMapEnabled,
    onToggleMap: () => isMapEnabled ? handleDisableMap() : handleEnableMap(),
    onOpenSitRep: () => setSitRepOpen(true),
    onSwitchToHero: () => setView("hero"),
    updatedAgo: updatedAgo,
    floodStats: floodStats,
    pushToast: pushToast
  }), /*#__PURE__*/React.createElement(EmergencyBanner, {
    wardData: currentWardData,
    floodStats: floodStats,
    timeStep: timeStep,
    onInspectHotspot: () => {
      setIsMapEnabled(true);
      let maxIdx = 0;
      sectorDepths.forEach((d, idx) => {
        if (d > sectorDepths[maxIdx]) maxIdx = idx;
      });
      setSelectedSector(maxIdx);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3 mt-3 mb-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleRefreshNowcast,
    disabled: nowcastBusy,
    type: "button",
    className: "flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
  }, nowcastBusy ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(RefreshCw, {
    className: "w-3.5 h-3.5 animate-spin"
  }), " Running Nowcast…") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Zap, {
    className: "w-3.5 h-3.5"
  }), " Refresh Nowcast")), nowcastResult && /*#__PURE__*/React.createElement("span", {
    className: `text-[11px] font-mono px-2.5 py-1 rounded-full border ${nowcastResult.status === "SUCCESS" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`
  }, nowcastResult.status), /*#__PURE__*/React.createElement("button", {
    onClick: () => setRouteCheckOpen(true),
    type: "button",
    className: "flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
  }, /*#__PURE__*/React.createElement(Route, {
    className: "w-3.5 h-3.5"
  }), " Route Safety Check"), telemetry && /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-mono shadow-sm text-slate-700"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-1.5 h-1.5 rounded-full bg-emerald-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-700 font-bold"
  }, telemetry.services && telemetry.services.imd_radar), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300"
  }, "·"), /*#__PURE__*/React.createElement("span", {
    className: "text-blue-700 font-bold"
  }, telemetry.services && telemetry.services.pysteps_nowcast), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300"
  }, "·"), /*#__PURE__*/React.createElement("span", {
    className: "text-amber-700 font-bold"
  }, telemetry.latency_ms, "ms"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300"
  }, "·"), /*#__PURE__*/React.createElement(Wifi, {
    className: "w-3 h-3 text-slate-400"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-600"
  }, telemetry.sensor_confidence_pct, "%"))), !isMapEnabled ? /*#__PURE__*/React.createElement("div", {
    className: "flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 mt-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "xl:col-span-4 flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center p-1 rounded-xl bg-white border border-slate-200 shadow-sm"
  }, [{
    id: "telemetry",
    label: "📍 Telemetry",
    icon: Activity
  }, {
    id: "routes",
    label: "🚗 Safe Routes",
    icon: Navigation
  }, {
    id: "scenario",
    label: "⚡ Simulate Run",
    icon: Play
  }, {
    id: "map",
    label: "🗺️ Map Layers",
    icon: Layers
  }].map(({
    id,
    label,
    icon: Icon
  }) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setActiveTab(id),
    className: `flex-1 flex items-center justify-center gap-1 py-2 px-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"}`
  }, /*#__PURE__*/React.createElement(Icon, {
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, label)))), activeTab === "telemetry" && /*#__PURE__*/React.createElement(HotspotTelemetryDeck, {
    wardData: currentWardData,
    sectorDepths: sectorDepths,
    onSelectSector: setSelectedSector,
    onEnableMap: handleEnableMap
  }), activeTab === "routes" && /*#__PURE__*/React.createElement(SafeRoutingPanel, {
    routes: ROUTE_OPTIONS,
    activeRouteIndex: activeRouteIndex,
    setActiveRouteIndex: setActiveRouteIndex,
    isSimulatingRoute: isSimulatingRoute,
    onStartSimulation: () => {
      setIsMapEnabled(true);
      setIsSimulatingRoute(true);
    },
    routeProgress: routeProgress,
    pushToast: pushToast,
    wardData: currentWardData,
    sectorDepths: sectorDepths
  }), activeTab === "scenario" && /*#__PURE__*/React.createElement(ScenarioSandbox, {
    scenario: scenario,
    setScenario: setScenario,
    pushToast: pushToast
  }), activeTab === "map" && /*#__PURE__*/React.createElement(TacticalMapControls, {
    layers: layers,
    setLayers: setLayers,
    floodStats: floodStats,
    wardData: currentWardData,
    selectedSector: selectedSector,
    onSelectSector: setSelectedSector,
    isMapEnabled: isMapEnabled,
    onEnableMap: handleEnableMap,
    onDisableMap: handleDisableMap,
    pushToast: pushToast
  }), /*#__PURE__*/React.createElement(WardVitalMetrics, {
    wardData: currentWardData,
    timeStep: timeStep,
    scenario: scenario,
    onOpenSitRep: () => setSitRepOpen(true)
  })), /*#__PURE__*/React.createElement("div", {
    className: "xl:col-span-8 flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement(MapStandbyDeck, {
    wardData: currentWardData,
    floodStats: floodStats,
    onEnableMap: handleEnableMap
  }))) :
  /*#__PURE__*/
  /* Overlay View: Dashboard Control Deck hovers directly over the Interactive Map */
  React.createElement("div", {
    className: "relative w-full flex-1 min-h-[660px] rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-950 flex flex-col mt-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative flex-1 w-full h-full min-h-[660px]"
  }, /*#__PURE__*/React.createElement(InteractiveVectorMap, {
    wardData: currentWardData,
    sectorDepths: sectorDepths,
    selectedSector: selectedSector,
    onSelectSector: setSelectedSector,
    layers: layers,
    activeRoute: ROUTE_OPTIONS[activeRouteIndex],
    isSimulatingRoute: isSimulatingRoute,
    routeProgress: routeProgress
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-4 right-4 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-800 shadow-lg flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-blue-600 animate-ping"
  }), /*#__PURE__*/React.createElement("span", null, currentWardData.name, " GIS Grid"), /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] px-2 py-0.5 rounded-full border ${currentWardData.riskColor}`
  }, currentWardData.riskLevel)), /*#__PURE__*/React.createElement("button", {
    onClick: handleDisableMap,
    className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold shadow-md cursor-pointer transition-all"
  }, /*#__PURE__*/React.createElement(EyeOff, {
    className: "w-3.5 h-3.5 text-amber-600"
  }), /*#__PURE__*/React.createElement("span", null, "Standby"))), /*#__PURE__*/React.createElement("div", {
    className: `absolute top-4 left-4 z-[450] transition-all duration-300 pointer-events-auto ${isDashboardMinimized ? "w-auto" : "w-[calc(100%-2rem)] max-w-md max-h-[calc(100%-6rem)]"}`
  }, isDashboardMinimized ? /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsDashboardMinimized(false),
    className: "flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xl border border-blue-500 cursor-pointer animate-in fade-in"
  }, /*#__PURE__*/React.createElement(Activity, {
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", null, "Expand Telemetry Dashboard")) : /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-3 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl p-4 max-h-[580px] overflow-y-auto text-slate-900"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-100 pb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-1 rounded-lg bg-blue-50 text-blue-700"
  }, /*#__PURE__*/React.createElement(Activity, {
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-extrabold uppercase tracking-wide text-slate-900"
  }, "Operations Control Deck")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsDashboardMinimized(true),
    className: "p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs cursor-pointer flex items-center gap-1",
    title: "Minimize Dashboard Overlay"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-semibold text-slate-500"
  }, "Minimize"), /*#__PURE__*/React.createElement(ChevronUp, {
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner"
  }, [{
    id: "telemetry",
    label: "Telemetry",
    icon: Activity
  }, {
    id: "routes",
    label: "Safe Routes",
    icon: Navigation
  }, {
    id: "scenario",
    label: "Simulate",
    icon: Play
  }, {
    id: "map",
    label: "Layers",
    icon: Layers
  }].map(({
    id,
    label,
    icon: Icon
  }) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setActiveTab(id),
    className: `flex-1 flex items-center justify-center gap-1 py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${activeTab === id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-blue-700"}`
  }, /*#__PURE__*/React.createElement(Icon, {
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, label)))), activeTab === "telemetry" && /*#__PURE__*/React.createElement(HotspotTelemetryDeck, {
    wardData: currentWardData,
    sectorDepths: sectorDepths,
    onSelectSector: setSelectedSector,
    onEnableMap: handleEnableMap
  }), activeTab === "routes" && /*#__PURE__*/React.createElement(SafeRoutingPanel, {
    routes: ROUTE_OPTIONS,
    activeRouteIndex: activeRouteIndex,
    setActiveRouteIndex: setActiveRouteIndex,
    isSimulatingRoute: isSimulatingRoute,
    onStartSimulation: () => {
      setIsMapEnabled(true);
      setIsSimulatingRoute(true);
    },
    routeProgress: routeProgress,
    pushToast: pushToast,
    wardData: currentWardData,
    sectorDepths: sectorDepths
  }), activeTab === "scenario" && /*#__PURE__*/React.createElement(ScenarioSandbox, {
    scenario: scenario,
    setScenario: setScenario,
    pushToast: pushToast
  }), activeTab === "map" && /*#__PURE__*/React.createElement(TacticalMapControls, {
    layers: layers,
    setLayers: setLayers,
    floodStats: floodStats,
    wardData: currentWardData,
    selectedSector: selectedSector,
    onSelectSector: setSelectedSector,
    isMapEnabled: isMapEnabled,
    onEnableMap: handleEnableMap,
    onDisableMap: handleDisableMap,
    pushToast: pushToast
  }), /*#__PURE__*/React.createElement(WardVitalMetrics, {
    wardData: currentWardData,
    timeStep: timeStep,
    scenario: scenario,
    onOpenSitRep: () => setSitRepOpen(true)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-4 left-4 right-4 z-[400] max-w-2xl mx-auto pointer-events-auto"
  }, /*#__PURE__*/React.createElement(TimeMachineBar, {
    timeStep: timeStep,
    setTimeStep: setTimeStep,
    isPlaying: isPlaying,
    setIsPlaying: setIsPlaying,
    playSpeed: playSpeed,
    setPlaySpeed: setPlaySpeed,
    hydrograph: HYDROGRAPH_DATA
  }))))));
}

// ============================================================================
// Map Standby Launcher Deck (Shown when map is disabled)
// ============================================================================

function MapStandbyDeck({
  wardData,
  floodStats,
  onEnableMap
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "relative rounded-lg border border-white/20 bg-zinc-950 p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl overflow-hidden min-h-[480px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 grid place-items-center w-16 h-16 rounded-lg bg-zinc-900 border border-white/30 text-white mb-5 shadow-lg"
  }, /*#__PURE__*/React.createElement(MapPin, {
    className: "w-8 h-8 text-white"
  })), /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 max-w-md space-y-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] uppercase font-bold tracking-widest text-zinc-300 bg-zinc-900 px-3 py-1 rounded-md border border-white/20"
  }, "Spatial Map Standby Mode"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-white tracking-tight pt-1"
  }, wardData.name, " Flood Map"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-zinc-400 leading-relaxed"
  }, "Interactive spatial map visualization is currently hidden. Click the button below to load the live spatial flood grid, depth gauges, and safe corridor routing.")), /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 mt-7 flex flex-col sm:flex-row items-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onEnableMap,
    className: "group flex items-center gap-3 px-8 py-3.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold border border-white shadow-lg transition-all cursor-pointer",
    type: "button"
  }, /*#__PURE__*/React.createElement(Power, {
    className: "w-4 h-4 fill-current text-zinc-950"
  }), /*#__PURE__*/React.createElement("span", null, "🗺️ View Interactive Map"), /*#__PURE__*/React.createElement(ArrowRight, {
    className: "w-4 h-4 transition-transform group-hover:translate-x-1"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 mt-8 grid grid-cols-3 gap-3 w-full max-w-md border-t border-zinc-800 pt-5 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-md bg-zinc-900 border border-zinc-800 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[10px] text-zinc-400 font-mono uppercase"
  }, "Monitored Sectors"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-white font-mono text-sm"
  }, wardData.sectors.length, " Nodes")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-md bg-zinc-900 border border-red-500/40 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[10px] text-red-300 font-mono uppercase"
  }, "Flooded / Impassable"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-red-400 font-mono text-sm"
  }, floodStats.critical, " High Risk")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-md bg-zinc-900 border border-emerald-500/40 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[10px] text-emerald-300 font-mono uppercase"
  }, "Clear / Passable"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-emerald-400 font-mono text-sm"
  }, floodStats.clear, " Clear"))));
}

// ============================================================================
// Top Navbar & Controls
// ============================================================================

// ============================================================================
// Top Navbar & Controls
// ============================================================================

function TopNavbar(props) {
  const {
    ward,
    wardOpen,
    setWardOpen,
    setWard,
    soundEnabled,
    setSoundEnabled,
    isMapEnabled,
    onToggleMap,
    onSwitchToHero,
    pushToast
  } = props;
  return /*#__PURE__*/React.createElement("header", {
    className: "flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onSwitchToHero,
    className: "flex items-center gap-3 text-left group cursor-pointer",
    title: "Return to Welcome Screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid place-items-center w-10 h-10 rounded-xl bg-blue-600 border border-blue-700 text-white shadow-sm"
  }, /*#__PURE__*/React.createElement(Waves, {
    className: "w-5 h-5 text-white"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-base font-extrabold text-blue-950 tracking-tight"
  }, "RainDrop GIS"), /*#__PURE__*/React.createElement("span", {
    className: "px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
  }, "PUBLIC SAFETY")), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-slate-500 font-mono tracking-wide"
  }, "Urban Flood Intelligence & Nowcasting Platform")))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onToggleMap,
    className: `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${isMapEnabled ? "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700" : "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"}`
  }, /*#__PURE__*/React.createElement(Power, {
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, isMapEnabled ? "🗺️ Live Map Active" : "🗺️ View Interactive Map")), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setWardOpen(!wardOpen),
    className: "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-sm"
  }, /*#__PURE__*/React.createElement(MapPin, {
    className: "w-3.5 h-3.5 text-blue-600"
  }), /*#__PURE__*/React.createElement("span", null, "Ward: ", ward), /*#__PURE__*/React.createElement(ChevronDown, {
    className: `w-3.5 h-3.5 text-slate-400 transition-transform ${wardOpen ? "rotate-180" : ""}`
  })), wardOpen && /*#__PURE__*/React.createElement("div", {
    className: "absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-2xl py-2 z-50 text-slate-900"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono"
  }, "Select Ward Operations Area"), WARDS.map(w => /*#__PURE__*/React.createElement("button", {
    key: w,
    onClick: () => {
      setWard(w);
      setWardOpen(false);
      pushToast(`Active operations ward switched to ${w}`);
    },
    className: `w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-blue-50 cursor-pointer ${w === ward ? "text-blue-900 font-extrabold bg-blue-50/70" : "text-slate-700"}`
  }, /*#__PURE__*/React.createElement("span", null, w), w === ward && /*#__PURE__*/React.createElement(Check, {
    className: "w-3.5 h-3.5 text-blue-600"
  }))))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSoundEnabled(!soundEnabled);
      pushToast(`Audio alert cues ${!soundEnabled ? "enabled" : "muted"}`);
    },
    className: `p-2 rounded-xl border transition-colors cursor-pointer shadow-sm ${soundEnabled ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600"}`,
    title: soundEnabled ? "Audio Alarms Active" : "Audio Alarms Muted"
  }, soundEnabled ? /*#__PURE__*/React.createElement(Volume2, {
    className: "w-4 h-4"
  }) : /*#__PURE__*/React.createElement(VolumeX, {
    className: "w-4 h-4"
  }))));
}

// ============================================================================
// Emergency Warning Banner
// ============================================================================

function EmergencyBanner({
  wardData,
  floodStats,
  timeStep,
  onInspectHotspot
}) {
  const isHighRisk = floodStats.critical > 2;
  return /*#__PURE__*/React.createElement("div", {
    className: `rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm ${isHighRisk ? "border-red-200 bg-red-50 text-red-950" : "border-amber-200 bg-amber-50 text-amber-950"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement(AlertOctagon, {
    className: `w-4 h-4 shrink-0 ${isHighRisk ? "text-red-600" : "text-amber-600"}`
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold tracking-wide"
  }, isHighRisk ? `🚨 PUBLIC EMERGENCY WATCH: ${wardData.riverName} approaching alert stage (${wardData.riverLevel}m). ${floodStats.critical} hotspots IMPASSABLE.` : `⚠️ MONSOON ADVISORY: Drainage pumps operating at ${wardData.activePumps} capacity. Waterlogging monitored in lowlands.`)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onInspectHotspot,
    className: "flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer border border-blue-700 shadow-sm"
  }, /*#__PURE__*/React.createElement(Eye, {
    className: "w-3.5 h-3.5 text-white"
  }), /*#__PURE__*/React.createElement("span", null, "🗺️ Open Interactive Map"))));
}

// ============================================================================
// Interactive Vector & Geospatial Map
// ============================================================================

function InteractiveVectorMap(props) {
  const {
    wardData,
    sectorDepths,
    selectedSector,
    onSelectSector,
    layers,
    activeRoute,
    isSimulatingRoute,
    routeProgress
  } = props;
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Initialize Leaflet map if not already created
    if (!mapInstanceRef.current) {
      const map = window.L.map(mapRef.current, {
        center: [19.071, 72.880],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });
      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // OpenStreetMap standard tile layer - 100% free & keyless
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });
      tileLayer.addTo(map);
      mapInstanceRef.current = map;
    }
    const map = mapInstanceRef.current;

    // Ensure Leaflet resizes correctly within container
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 150);

    // Clear existing markers & overlays
    markersRef.current.forEach(layer => map.removeLayer(layer));
    markersRef.current = [];
    const bounds = [];

    // Render spatial inundation grid & sector water depth markers
    wardData.sectors.forEach((sec, idx) => {
      const depth = sectorDepths[idx] || 0;
      const coords = sec.coords.split(',').map(n => parseFloat(n.trim()));
      if (coords.length < 2 || isNaN(coords[0]) || isNaN(coords[1])) return;
      const [lat, lon] = coords;
      bounds.push([lat, lon]);
      let fillColor = "#059669"; // Safety Emerald Green
      let borderTone = "#10b981";
      let statusText = "PASSABLE / SAFE";
      if (depth >= 30) {
        fillColor = "#dc2626"; // Crimson Red
        borderTone = "#ef4444";
        statusText = "CRITICAL FLOODING";
      } else if (depth >= 15) {
        fillColor = "#d97706"; // Amber Caution
        borderTone = "#f59e0b";
        statusText = "INUNDATION CAUTION";
      }
      const isSelected = selectedSector === idx;

      // 1. Spatial Inundation Water Radius Circle Overlay
      if (layers.heatmap) {
        const circleRadius = Math.max(70, depth * 4 + 40);
        const circle = window.L.circle([lat, lon], {
          radius: circleRadius,
          color: borderTone,
          fillColor: fillColor,
          fillOpacity: isSelected ? 0.5 : 0.28,
          weight: isSelected ? 3 : 1.8
        }).addTo(map);
        circle.on('click', () => onSelectSector(idx));
        markersRef.current.push(circle);
      }

      // 2. Interactive Circular Marker Icon (Clean circular dot with water depth number; click reveals full locality name & details)
      const htmlIcon = window.L.divIcon({
        className: 'custom-circular-marker',
        html: `<div style="background:#ffffff; border: ${isSelected ? '3.5px' : '2px'} solid ${borderTone}; color: #0f172a; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; font-family: Inter, sans-serif; box-shadow: 0 4px 12px rgba(15,23,42,0.22); cursor: pointer; transition: transform 0.2s;" title="Click to view locality name and details for ${sec.name}">
                    <span style="color: ${borderTone}; font-size: 11px; font-weight: 900;">${depth}</span>
                </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      const marker = window.L.marker([lat, lon], {
        icon: htmlIcon
      }).addTo(map).bindPopup(`
                    <div style="font-family: Inter, sans-serif; padding: 6px; color: #0f172a; min-width: 210px;">
                        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2563eb;">${wardData.name} · Sector #${sec.id}</div>
                        <h4 style="margin: 3px 0 6px 0; font-size: 14px; font-weight: 800; color: #0f172a;">${sec.name}</h4>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #475569; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
                            <span>Elevation MSL:</span> <strong style="color: #0f172a;">${sec.elevation}m</strong>
                        </div>
                        <div style="margin-top: 6px; font-size: 13px; font-weight: 800; color: ${fillColor}; display: flex; align-items: center; justify-content: space-between;">
                            <span>Water Level:</span>
                            <span>${depth} cm</span>
                        </div>
                        <div style="font-size: 10px; font-weight: 800; color: ${fillColor}; margin-top: 3px; text-transform: uppercase;">
                            ${statusText}
                        </div>
                    </div>
                `);
      marker.on('click', () => onSelectSector(idx));
      markersRef.current.push(marker);
    });

    // Auto Fit Map Bounds to Ward Sectors
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 15
        });
      } catch (_) {}
    }

    // Render Safe Corridor & Bypass Route Lines
    if (layers.safeCorridor && activeRoute) {
      if (bounds.length >= 2) {
        // Blocked Route Polyline (Red Dashed)
        const blockedPoly = window.L.polyline([bounds[0], bounds[1]], {
          color: '#dc2626',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.85
        }).addTo(map);

        // Safe Corridor Polyline (Municipal Blue / Emerald Solid)
        const safeCoords = bounds.slice(0, 4);
        const safePoly = window.L.polyline(safeCoords, {
          color: '#2563eb',
          weight: 6,
          opacity: 0.95
        }).addTo(map);
        markersRef.current.push(blockedPoly);
        markersRef.current.push(safePoly);
      }
    }
  }, [wardData, sectorDepths, selectedSector, layers, activeRoute, isSimulatingRoute, routeProgress]);
  return /*#__PURE__*/React.createElement("div", {
    className: "relative w-full h-full min-h-[480px]"
  }, /*#__PURE__*/React.createElement("div", {
    ref: mapRef,
    className: "w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-200 shadow-sm"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-3 left-3 z-[400] bg-white/95 border border-slate-200 p-3 rounded-xl text-[11px] font-mono text-slate-700 space-y-1.5 backdrop-blur shadow-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold text-blue-900 mb-1 flex items-center gap-1.5 text-xs font-sans"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-blue-600 animate-ping"
  }), "Live Spatial Inundation Grid"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded-full bg-red-600 border border-white"
  }), /*#__PURE__*/React.createElement("span", null, "≥30cm Critical Flooding")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded-full bg-amber-500 border border-white"
  }), /*#__PURE__*/React.createElement("span", null, "15-29cm Inundation Caution")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded-full bg-emerald-600 border border-white"
  }), /*#__PURE__*/React.createElement("span", null, "<15cm Clear Safe Corridor"))));
}

// ============================================================================
// Sector Telemetry Drawer (Click to Inspect)
// ============================================================================

function SectorDrawer({
  sector,
  depth,
  wardName,
  onClose,
  pushToast
}) {
  const isHigh = depth >= 30;
  const isMed = depth >= 15 && depth < 30;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-y-0 right-0 w-full sm:w-96 bg-[#111625]/98 border-l border-slate-700/80 shadow-2xl backdrop-blur-2xl z-[75] p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between pb-4 border-b border-slate-800"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase font-bold tracking-widest text-indigo-400"
  }, wardName, " · Hotspot Telemetry"), /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-bold text-white mt-0.5"
  }, sector.name), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] font-mono text-slate-400"
  }, sector.coords, " · Elevation: ", sector.elevation, "m MSL")), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
  }, /*#__PURE__*/React.createElement(X, {
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "my-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-slate-300"
  }, "Live Inundation Depth"), /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] font-bold px-2 py-0.5 rounded-full border ${isHigh ? "border-rose-500/40 bg-rose-500/10 text-rose-300" : isMed ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"}`
  }, isHigh ? "CRITICAL RISK" : isMed ? "MODERATE HAZARD" : "SAFE ELEVATION")), /*#__PURE__*/React.createElement(WaterDepthWave, {
    depth: depth
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2.5 mb-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-slate-900/80 border border-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, "Surface Flow Velocity"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold font-mono text-white mt-1"
  }, depth > 0 ? (1.2 + depth * 0.02).toFixed(1) : "0.0", " m/s"), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500"
  }, "Vector: South Creek")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-slate-900/80 border border-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, "Storm Culvert Status"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold font-mono text-white mt-1"
  }, depth > 30 ? "92% Surcharged" : depth > 15 ? "64% Flowing" : "28% Free"), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500"
  }, "Gravity outfall active"))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 mb-5"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Car, {
    className: "w-3.5 h-3.5 text-indigo-400"
  }), "Vehicle Passability Matrix"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between py-1 border-b border-slate-800/60"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "🚶 Pedestrians"), /*#__PURE__*/React.createElement("span", {
    className: `font-semibold ${depth >= 15 ? "text-rose-400" : "text-emerald-400"}`
  }, depth >= 15 ? "Hazardous (No cross)" : "Passable")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between py-1 border-b border-slate-800/60"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "🛵 Two-Wheelers"), /*#__PURE__*/React.createElement("span", {
    className: `font-semibold ${depth >= 20 ? "text-rose-400" : "text-emerald-400"}`
  }, depth >= 20 ? "Stall Risk" : "Passable")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between py-1 border-b border-slate-800/60"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "🚗 Sedans & Hatchbacks"), /*#__PURE__*/React.createElement("span", {
    className: `font-semibold ${depth >= 25 ? "text-rose-400" : "text-emerald-400"}`
  }, depth >= 25 ? "Impassable" : "Passable with caution")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between py-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "🚒 Emergency Trucks / Buses"), /*#__PURE__*/React.createElement("span", {
    className: `font-semibold ${depth >= 45 ? "text-amber-400" : "text-emerald-400"}`
  }, depth >= 45 ? "High Clearance Only" : "Passable")))), /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl border border-slate-800 bg-slate-900/80 p-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[11px] text-slate-400 mb-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1 font-semibold text-slate-300"
  }, /*#__PURE__*/React.createElement(Cpu, {
    className: "w-3 h-3 text-indigo-400"
  }), "Sensor Confidence: 94.2%"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-[9px] text-emerald-400"
  }, "Live AI Stream")), /*#__PURE__*/React.createElement("p", {
    className: "text-[10.5px] text-slate-400 leading-relaxed font-mono"
  }, "Telemetry validated against Municipal Ultrasonic Sensor #KU-84 & CCTV water-level marker algorithms."))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2 pt-3 border-t border-slate-800"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => pushToast(`Mobile Dewatering Pump dispatched to ${sector.name}`),
    className: "w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
  }, /*#__PURE__*/React.createElement(Zap, {
    className: "w-3.5 h-3.5"
  }), "Dispatch Dewatering Pump"), /*#__PURE__*/React.createElement("button", {
    onClick: () => pushToast(`Traffic Diversion Alert broadcast for ${sector.name}`),
    className: "w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
  }, /*#__PURE__*/React.createElement(Send, {
    className: "w-3.5 h-3.5"
  }), "Issue Traffic Divert Notice")));
}

// ============================================================================
// Time Machine & Hydrograph Controller
// ============================================================================

function TimeMachineBar(props) {
  const {
    timeStep,
    setTimeStep,
    isPlaying,
    setIsPlaying,
    playSpeed,
    setPlaySpeed,
    hydrograph
  } = props;
  const current = hydrograph[timeStep] || hydrograph[0];
  return /*#__PURE__*/React.createElement("div", {
    className: "mt-2 pt-3 border-t border-slate-800/80 flex flex-col gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsPlaying(!isPlaying),
    className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${isPlaying ? "bg-amber-500 text-slate-950 hover:bg-amber-400" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/25"}`
  }, isPlaying ? /*#__PURE__*/React.createElement(Pause, {
    className: "w-3.5 h-3.5 fill-current"
  }) : /*#__PURE__*/React.createElement(Play, {
    className: "w-3.5 h-3.5 fill-current"
  }), /*#__PURE__*/React.createElement("span", null, isPlaying ? "Pause Forecast" : "Simulate Run")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPlaySpeed(playSpeed === 1 ? 2 : 1),
    className: "px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold cursor-pointer"
  }, playSpeed, "x"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-300 font-semibold ml-2 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Clock, {
    className: "w-3.5 h-3.5 text-indigo-400"
  }), /*#__PURE__*/React.createElement("span", null, "Horizon: ", /*#__PURE__*/React.createElement("strong", {
    className: "text-white font-mono"
  }, current.t), " (", current.label, ")"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, hydrograph.map((step, idx) => /*#__PURE__*/React.createElement("button", {
    key: step.t,
    onClick: () => {
      setTimeStep(idx);
      setIsPlaying(false);
    },
    className: `px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${timeStep === idx ? "bg-indigo-600 text-white font-bold shadow-sm" : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60"}`
  }, step.t)))), /*#__PURE__*/React.createElement("div", {
    className: "relative w-full h-14 bg-[#090d16] rounded-xl border border-slate-800/80 p-1.5 flex items-end justify-between overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-1 left-2 text-[9px] font-mono text-slate-500"
  }, "Rainfall Intensity (mm/h) & River Surge Projection (m)"), hydrograph.map((item, idx) => {
    const isCurrent = timeStep === idx;
    const barHeight = Math.min(100, Math.max(15, item.rain / 60 * 100));
    return /*#__PURE__*/React.createElement("div", {
      key: item.t,
      onClick: () => {
        setTimeStep(idx);
        setIsPlaying(false);
      },
      className: "flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
    }, /*#__PURE__*/React.createElement("div", {
      className: `w-4/5 rounded-t transition-all duration-300 ${isCurrent ? "bg-gradient-to-t from-indigo-600 to-sky-400 opacity-90 shadow-md shadow-indigo-500/50" : "bg-slate-700/40 group-hover:bg-slate-600/60"}`,
      style: {
        height: `${barHeight}%`
      }
    }), isCurrent && /*#__PURE__*/React.createElement("div", {
      className: "absolute top-0 bottom-0 w-0.5 bg-sky-400 shadow-lg shadow-sky-400"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-2 h-2 -ml-[3px] rounded-full bg-white border border-sky-400"
    })));
  })));
}

// ============================================================================
// ============================================================================
// Hotspot Telemetry & Sump Status Deck
// ============================================================================

function HotspotTelemetryDeck({
  wardData,
  sectorDepths,
  onSelectSector,
  onEnableMap
}) {
  const sortedSectors = wardData.sectors.map((s, idx) => ({
    ...s,
    depth: sectorDepths[idx] || 0
  })).sort((a, b) => b.depth - a.depth);
  const totalFlooded = sortedSectors.filter(s => s.depth >= 30).length;
  const totalCaution = sortedSectors.filter(s => s.depth >= 15 && s.depth < 30).length;
  const totalSafe = sortedSectors.filter(s => s.depth < 15).length;
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-lg flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-white flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Activity, {
    className: "w-4 h-4 text-white"
  }), "Hotspot Telemetry & Sump Overview"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-white/20"
  }, wardData.code, " Live Feed")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-zinc-400 mt-1"
  }, "Real-time depth sensors, pump status, and plain-English flood situation telemetry.")), /*#__PURE__*/React.createElement("div", {
    className: "rounded-md border border-white/20 bg-zinc-900 p-3 text-xs leading-relaxed"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-white font-bold mb-1"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "w-4 h-4 text-yellow-400"
  }), /*#__PURE__*/React.createElement("span", null, "What Is Happening Right Now:")), /*#__PURE__*/React.createElement("p", {
    className: "text-zinc-300 text-[11px]"
  }, "Heavy rainfall (", wardData.rainfallForecast, ") paired with ", wardData.riverName, " tide (", wardData.riverLevel, "m) is creating backwater surcharge.", /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-red-400"
  }, " ", totalFlooded, " low-lying hotspots are severely flooded (>30cm)"), ".", wardData.activePumps, " dewatering pumps are actively discharging stormwater.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 text-center text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2 rounded bg-zinc-900 border border-red-500/40"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[9px] uppercase text-zinc-400 font-mono"
  }, "Flooded"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-red-400 font-mono text-sm"
  }, totalFlooded, " Hotspots")), /*#__PURE__*/React.createElement("div", {
    className: "p-2 rounded bg-zinc-900 border border-yellow-500/40"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[9px] uppercase text-zinc-400 font-mono"
  }, "Caution"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-yellow-400 font-mono text-sm"
  }, totalCaution, " Hotspots")), /*#__PURE__*/React.createElement("div", {
    className: "p-2 rounded bg-zinc-900 border border-emerald-500/40"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[9px] uppercase text-zinc-400 font-mono"
  }, "Clear"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-emerald-400 font-mono text-sm"
  }, totalSafe, " Hotspots"))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 max-h-72 overflow-y-auto pr-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase font-bold text-zinc-400 tracking-wider"
  }, "Top Critical Hotspot Telemetry"), sortedSectors.slice(0, 6).map(sec => /*#__PURE__*/React.createElement("div", {
    key: sec.id,
    onClick: () => {
      onEnableMap();
      onSelectSector(sec.id);
    },
    className: "p-2.5 rounded-md border border-zinc-800 bg-zinc-900/90 hover:border-white/40 transition-all cursor-pointer flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-white"
  }, sec.name)), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-zinc-400 font-mono"
  }, "Elev: ", sec.elevation, "m · ", sec.coords)), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono font-bold text-sm block text-white"
  }, sec.depth, " cm"), /*#__PURE__*/React.createElement("span", {
    className: `text-[9px] font-bold px-1.5 py-0.5 rounded border ${sec.depth >= 30 ? "bg-red-500/20 text-red-300 border-red-500/40" : sec.depth >= 15 ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"}`
  }, sec.depth >= 30 ? "🛑 IMPASSABLE" : sec.depth >= 15 ? "⚠️ CAUTION" : "🟢 SAFE"))))));
}

// ============================================================================
// Simulate Run Engine — Real-time Event Simulation
// ============================================================================

function ScenarioSandbox({
  scenario,
  setScenario,
  pushToast
}) {
  const [simStep, setSimStep] = useState(0);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const SIMULATION_PHASES = [{
    title: "Minute 00: Cloudburst Initiation",
    desc: "Monsoon cloudburst delivers 54 mm/hr precipitation. Runoff begins entering drainage sumps.",
    status: "RUNOFF START"
  }, {
    title: "Minute 15: Lowland Inundation",
    desc: "Retention basins reach 85% capacity. Water accumulates at Kurla Subway and Bail Bazar.",
    status: "SURCHARGE ALERT"
  }, {
    title: "Minute 30: Peak Inundation",
    desc: "Kurla Station West Subway submersed under 42cm water. Impassable for light motor vehicles.",
    status: "PEAK SUBMERSION"
  }, {
    title: "Minute 45: Dewatering Pump Engagement",
    desc: "All 10 stormwater dewatering pumps engaged (45,000 L/min discharge). Backwater stabilized.",
    status: "PUMPS ACTIVE"
  }, {
    title: "Minute 60: Receding Water Level",
    desc: "Rainfall subsides. Water level receding by 8 cm/hr across primary corridors.",
    status: "RECEDING FLOW"
  }];
  const handleRunLiveSim = () => {
    setIsSimRunning(true);
    setSimStep(0);
    pushToast("Starting real-time flood event simulation run...");
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current >= SIMULATION_PHASES.length) {
        clearInterval(interval);
        setIsSimRunning(false);
        pushToast("Flood event simulation completed!");
      } else {
        setSimStep(current);
      }
    }, 2200);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-lg flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-white flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Play, {
    className: "w-4 h-4 text-white"
  }), "Simulate Run — Real-Time Flood Timeline"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-white/20"
  }, "Event Simulator")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-zinc-400 mt-1"
  }, "Simulate cloudburst downpours, high tides, or pump outages to see what is actually happening.")), /*#__PURE__*/React.createElement("div", {
    className: "rounded-md border border-white/20 bg-zinc-900 p-3.5 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white uppercase tracking-wider"
  }, "What Is Actually Happening:"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700"
  }, SIMULATION_PHASES[simStep].status)), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded bg-zinc-950 border border-zinc-800"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-white"
  }, SIMULATION_PHASES[simStep].title), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-zinc-300 mt-1 leading-relaxed"
  }, SIMULATION_PHASES[simStep].desc)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-5 gap-1 pt-1"
  }, SIMULATION_PHASES.map((ph, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    onClick: () => setSimStep(idx),
    className: `h-2 rounded-sm cursor-pointer transition-all ${idx === simStep ? "bg-white" : idx < simStep ? "bg-zinc-500" : "bg-zinc-800"}`,
    title: ph.title
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: handleRunLiveSim,
    disabled: isSimRunning,
    className: "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold border border-white shadow transition-all cursor-pointer disabled:opacity-50"
  }, /*#__PURE__*/React.createElement(Play, {
    className: "w-4 h-4 fill-current text-zinc-950"
  }), /*#__PURE__*/React.createElement("span", null, isSimRunning ? `Simulating Phase ${simStep + 1} of 5…` : "▶️ Start Live Flood Event Simulation")), /*#__PURE__*/React.createElement("div", {
    className: "pt-3 border-t border-zinc-800 space-y-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase font-bold text-zinc-400 tracking-wider block"
  }, "Environmental Stress-Test Parameters"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-xs mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-zinc-300 font-medium"
  }, "Rainfall Intensity"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-white font-bold"
  }, Math.round(scenario.rainfallMultiplier * 45), " mm/h (", scenario.rainfallMultiplier.toFixed(1), "x)")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0.5",
    max: "3.0",
    step: "0.1",
    value: scenario.rainfallMultiplier,
    onChange: e => setScenario(s => ({
      ...s,
      rainfallMultiplier: parseFloat(e.target.value)
    })),
    className: "w-full accent-white cursor-pointer"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-xs mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-zinc-300 font-medium"
  }, "Mithi Creek Tidal Offset"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-white font-bold"
  }, scenario.tideOffset >= 0 ? `+${scenario.tideOffset.toFixed(1)}m` : `${scenario.tideOffset.toFixed(1)}m`)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "-1.0",
    max: "2.0",
    step: "0.2",
    value: scenario.tideOffset,
    onChange: e => setScenario(s => ({
      ...s,
      tideOffset: parseFloat(e.target.value)
    })),
    className: "w-full accent-white cursor-pointer"
  }))));
}

// ============================================================================
// Smart Safe Route App — Flooded Regions & Safe Corridors
// ============================================================================

function SafeRoutingPanel(props) {
  const {
    routes,
    activeRouteIndex,
    setActiveRouteIndex,
    isSimulatingRoute,
    onStartSimulation,
    routeProgress,
    wardData,
    sectorDepths
  } = props;
  const currentRoute = routes[activeRouteIndex];

  // Identify flooded sectors
  const floodedSectors = wardData ? wardData.sectors.map((s, idx) => ({
    ...s,
    depth: sectorDepths[idx] || 0
  })).filter(s => s.depth >= 25) : [];
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-lg flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-white flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Navigation, {
    className: "w-4 h-4 text-white"
  }), "Smart Safe Route App"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-white/20"
  }, "Flood-Aware Routing")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-zinc-400 mt-1"
  }, "Detects flooded road regions and computes 100% safe elevation corridors for transit.")), /*#__PURE__*/React.createElement("div", {
    className: "rounded-md border border-red-500/40 bg-red-950/20 p-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1.5"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "w-3.5 h-3.5 text-red-400"
  }), "⛔ Currently Flooded Regions to Avoid (", floodedSectors.length, " Active Hazards)"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, floodedSectors.slice(0, 4).map(s => /*#__PURE__*/React.createElement("span", {
    key: s.id,
    className: "text-[10px] font-bold px-2 py-0.5 rounded border bg-red-500/20 border-red-500/50 text-red-300 font-mono"
  }, "🛑 ", s.name, " (", s.depth, "cm)")), floodedSectors.length === 0 && /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-emerald-400"
  }, "All primary road sectors clear."))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, routes.map((r, idx) => /*#__PURE__*/React.createElement("button", {
    key: r.id,
    onClick: () => setActiveRouteIndex(idx),
    className: `flex-1 py-2 px-2.5 rounded-md border text-xs font-semibold transition-all cursor-pointer text-left ${activeRouteIndex === idx ? "border-white bg-white text-zinc-950 font-bold shadow" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[9px] uppercase font-mono text-zinc-400"
  }, "Corridor ", idx + 1), /*#__PURE__*/React.createElement("span", {
    className: "truncate block font-bold"
  }, r.origin, " → ", r.destination)))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-md border border-red-500/40 bg-zinc-900 p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-red-400 flex items-center gap-1"
  }, "❌ Standard Direct Route"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-mono font-bold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30"
  }, "BLOCKED BY FLOOD")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-zinc-300 font-mono"
  }, currentRoute.standard.dist, " · ", currentRoute.standard.time), /*#__PURE__*/React.createElement("p", {
    className: "text-[10.5px] text-red-300 mt-1 font-sans"
  }, "⚠️ ", currentRoute.standard.blockReason)), /*#__PURE__*/React.createElement("div", {
    className: "rounded-md border border-emerald-500/50 bg-zinc-900 p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-emerald-400 flex items-center gap-1"
  }, "🟢 Smart Safe Elevation Route"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30"
  }, "100% CLEAR & SAFE")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-zinc-200 font-mono"
  }, currentRoute.safeRoute.dist, " · ", currentRoute.safeRoute.time, " · ", currentRoute.safeRoute.elevation), /*#__PURE__*/React.createElement("p", {
    className: "text-[10.5px] text-emerald-300 mt-1 font-sans"
  }, "✅ ", currentRoute.safeRoute.corridor))), /*#__PURE__*/React.createElement("button", {
    onClick: onStartSimulation,
    disabled: isSimulatingRoute,
    className: "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold border border-white shadow transition-all cursor-pointer"
  }, /*#__PURE__*/React.createElement(Play, {
    className: "w-4 h-4 fill-current text-zinc-950"
  }), /*#__PURE__*/React.createElement("span", null, isSimulatingRoute ? `Simulating Safe Transit (${routeProgress}%)…` : "🗺️ Open Map &amp; Simulate Safe Navigation")));
}

// ============================================================================
// Tactical Map Layer Controls
// ============================================================================

function TacticalMapControls({
  layers,
  setLayers,
  floodStats,
  wardData,
  selectedSector,
  onSelectSector,
  isMapEnabled,
  onEnableMap,
  onDisableMap,
  pushToast
}) {
  const toggleLayer = (key, label) => {
    setLayers(prev => {
      const next = {
        ...prev,
        [key]: !prev[key]
      };
      pushToast(`${label} layer ${next[key] ? "visible" : "hidden"}`);
      return next;
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl border border-slate-800/90 bg-slate-900/85 backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-white flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Layers, {
    className: "w-4 h-4 text-indigo-400"
  }), "Map Controls & GIS Layers"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-400 mt-0.5"
  }, "Toggle spatial layers and map visibility state.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => isMapEnabled ? onDisableMap() : onEnableMap(),
    className: `flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isMapEnabled ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" : "border-indigo-500/40 bg-indigo-600 text-white hover:bg-indigo-500"}`
  }, /*#__PURE__*/React.createElement(Power, {
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, isMapEnabled ? "Map: Active" : "Enable Map"))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1 divide-y divide-slate-800/60"
  }, /*#__PURE__*/React.createElement(ToggleRow, {
    label: "🌊 Flood Inundation Heatmap",
    checked: layers.heatmap,
    onChange: () => toggleLayer("heatmap", "Flood Inundation")
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "⚡ Drainage Pumps & Sluice Gates",
    checked: layers.pumps,
    onChange: () => toggleLayer("pumps", "Drainage Pumps")
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "🏥 Evacuation Shelters & Relief Camps",
    checked: layers.shelters,
    onChange: () => toggleLayer("shelters", "Emergency Shelters")
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "🚗 Dynamic Safe Navigation Path",
    checked: layers.safeCorridor,
    onChange: () => toggleLayer("safeCorridor", "Safe Route Corridor")
  }), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "📐 Topographical Elevation Contours",
    checked: layers.elevationContours,
    onChange: () => toggleLayer("elevationContours", "Elevation Contours")
  })));
}

// ============================================================================
// Backend Services Deck
// ============================================================================

function BackendServicesDeck(props) {
  const {
    radarBusy,
    setRadarBusy,
    terrainBusy,
    setTerrainBusy,
    simBusy,
    setSimBusy,
    statusBusy,
    setStatusBusy,
    radarTime,
    setRadarTime,
    latency,
    setLatency,
    runAction,
    pushToast
  } = props;
  const handleRefreshRadar = async () => {
    setRadarBusy(true);
    try {
      const res = await fetch("/api/run_pipeline", {
        method: "POST"
      });
      const data = await res.json();
      const now = new Date();
      setRadarTime(now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }));
      pushToast(data.message || "Optical flow nowcast updated via pySTEPS pipeline");
    } catch (err) {
      pushToast("Radar telemetry refreshed (offline fallback)");
    } finally {
      setRadarBusy(false);
    }
  };
  const handlePingFeeds = async () => {
    setStatusBusy(true);
    const startTime = performance.now();
    try {
      const res = await fetch("/api/telemetry_status");
      const data = await res.json();
      const calcLatency = Math.round(performance.now() - startTime);
      setLatency(data.latency_ms || calcLatency || 11);
      pushToast(`API Gateway: status 200 OK (${data.latency_ms || calcLatency}ms)`);
    } catch (err) {
      pushToast("API Gateway probe completed");
    } finally {
      setStatusBusy(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl border border-slate-800/90 bg-slate-900/85 backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-white flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Server, {
    className: "w-4 h-4 text-indigo-400"
  }), "Integrated Service Engines"), /*#__PURE__*/React.createElement(StatusPill, {
    busy: radarBusy || terrainBusy || simBusy || statusBusy,
    label: "All Online"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-slate-200"
  }, "IMD Radar Feed"), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-slate-400 mt-0.5"
  }, "Last Sync: ", radarTime)), /*#__PURE__*/React.createElement("button", {
    onClick: handleRefreshRadar,
    disabled: radarBusy,
    className: "mt-2 text-[10px] font-bold py-1 px-2 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer text-center"
  }, radarBusy ? "Syncing…" : "Refresh Radar")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-slate-200"
  }, "1D-2D Hydraulics"), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-slate-400 mt-0.5"
  }, "SWMM-HEC Coupled")), /*#__PURE__*/React.createElement("button", {
    onClick: () => runAction(setSimBusy, "1D pipe & 2D overland mesh recalculated"),
    disabled: simBusy,
    className: "mt-2 text-[10px] font-bold py-1 px-2 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer text-center"
  }, simBusy ? "Calculating…" : "Run Simulation")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-slate-200"
  }, "DEM Topography"), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-slate-400 mt-0.5"
  }, "Infiltration: 32%")), /*#__PURE__*/React.createElement("button", {
    onClick: () => runAction(setTerrainBusy, "DEM high-resolution elevation surface updated"),
    disabled: terrainBusy,
    className: "mt-2 text-[10px] font-bold py-1 px-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer text-center"
  }, terrainBusy ? "Mapping…" : "Assess DEM")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-slate-200"
  }, "API Gateway"), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-slate-400 mt-0.5"
  }, "Latency: ", latency, " ms")), /*#__PURE__*/React.createElement("button", {
    onClick: handlePingFeeds,
    disabled: statusBusy,
    className: "mt-2 text-[10px] font-bold py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer text-center"
  }, statusBusy ? "Probing…" : "Ping Feeds"))));
}

// ============================================================================
// Ward River & Drainage Vital Card
// ============================================================================

function WardVitalMetrics({
  wardData,
  timeStep,
  scenario,
  onOpenSitRep
}) {
  const dynamicRiverLevel = (wardData.riverLevel * (0.85 + timeStep * 0.15) * scenario.rainfallMultiplier + scenario.tideOffset * 0.3).toFixed(2);
  const isRiverOver = dynamicRiverLevel >= wardData.dangerLevel;
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl border border-slate-800/90 bg-slate-900/85 backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-slate-200 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(Droplets, {
    className: "w-3.5 h-3.5 text-sky-400"
  }), wardData.riverName), /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] font-bold px-2 py-0.5 rounded-full border ${isRiverOver ? "border-rose-500/40 bg-rose-500/10 text-rose-300" : "border-sky-500/40 bg-sky-500/10 text-sky-300"}`
  }, isRiverOver ? "OVERFLOW STAGE" : "BANK-FULL ACTIVE")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-baseline justify-between border-b border-slate-800 pb-2.5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-2xl font-bold font-mono text-white"
  }, dynamicRiverLevel), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400 ml-1 font-mono"
  }, "/ ", wardData.dangerLevel, "m max")), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400"
  }, "Drainage Pumps: ", /*#__PURE__*/React.createElement("strong", {
    className: "text-white font-mono"
  }, wardData.activePumps))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs text-slate-400"
  }, /*#__PURE__*/React.createElement("span", null, "Relief Shelters:"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-200"
  }, wardData.evacShelters)));
}

// ============================================================================
// Situation Report (SitRep) Modal
// ============================================================================

function SitRepModal({
  ward,
  wardData,
  floodStats,
  sectorDepths,
  timeStep,
  scenario,
  onClose,
  pushToast
}) {
  const currentForecast = HYDROGRAPH_DATA[timeStep] || HYDROGRAPH_DATA[0];
  const handlePrint = () => {
    window.print();
  };
  const handleCopyMarkdown = () => {
    const text = `# AQUASIGHT SITUATION REPORT (SITREP)
**Ward:** ${ward} (${wardData.code})
**Timestamp:** ${new Date().toLocaleString()} | Forecast Horizon: ${currentForecast.t} (${currentForecast.label})
**Overall Risk Status:** ${wardData.riskLevel}

## Flood Impact Metrics
- Clear / Passable Sectors: ${floodStats.clear}
- Caution / Waterlogged Sectors: ${floodStats.caution}
- Critical / Impassable Sectors: ${floodStats.critical}
- Active Drainage Pumps: ${wardData.activePumps}
- River Channel Level: ${wardData.riverName} at ${wardData.riverLevel}m (Alert: ${wardData.dangerLevel}m)
- Evacuation Shelters: ${wardData.evacShelters}

## Recommended Actions
1. Deploy mobile dewatering units to lowest elevation sectors.
2. Divert commuter transit along designated Safe Elevation Corridors.
3. Alert local police & emergency dispatch for subway closures.
`;
    navigator.clipboard.writeText(text).then(() => {
      pushToast("SitRep markdown copied to clipboard!");
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#121624] shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between border-b border-slate-800 pb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300"
  }, /*#__PURE__*/React.createElement(FileText, {
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase font-bold tracking-wider text-indigo-400"
  }, "Official Incident Log · BMC / NDRF"), /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold text-white"
  }, "AquaSight Situation Report (SitRep)"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 font-mono"
  }, ward, " · ", wardData.code, " · Generated ", new Date().toLocaleTimeString()))), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
  }, /*#__PURE__*/React.createElement(X, {
    className: "w-5 h-5"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-slate-900 border border-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, "Flooded Sectors"), /*#__PURE__*/React.createElement("p", {
    className: "text-xl font-bold font-mono text-rose-400 mt-1"
  }, floodStats.critical), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500"
  }, "Roads submerged >30cm")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-slate-900 border border-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, "Passable Corridors"), /*#__PURE__*/React.createElement("p", {
    className: "text-xl font-bold font-mono text-emerald-400 mt-1"
  }, floodStats.clear), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500"
  }, "Dry emergency routes")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-slate-900 border border-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, "River Spillway"), /*#__PURE__*/React.createElement("p", {
    className: "text-xl font-bold font-mono text-sky-400 mt-1"
  }, wardData.riverLevel, "m"), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500"
  }, "Alert threshold: ", wardData.dangerLevel, "m"))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 space-y-2"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-indigo-300 uppercase tracking-wider"
  }, "Incident Commander Directives"), /*#__PURE__*/React.createElement("ul", {
    className: "text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed"
  }, /*#__PURE__*/React.createElement("li", null, "Subway and underpass gates closed at ", /*#__PURE__*/React.createElement("strong", null, "Bail Bazar"), " and ", /*#__PURE__*/React.createElement("strong", null, "Station West"), "."), /*#__PURE__*/React.createElement("li", null, "Direct emergency ambulances via ", /*#__PURE__*/React.createElement("strong", null, "Kalina CST Flyover Upper Deck"), "."), /*#__PURE__*/React.createElement("li", null, "All ", /*#__PURE__*/React.createElement("strong", null, wardData.activePumps), " stormwater pumps energized on continuous suction."), /*#__PURE__*/React.createElement("li", null, "Disaster management teams pre-staged at 4 local shelter facilities."))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-3 border-t border-slate-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handlePrint,
    className: "flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
  }, /*#__PURE__*/React.createElement(Printer, {
    className: "w-3.5 h-3.5"
  }), "Print SitRep"), /*#__PURE__*/React.createElement("button", {
    onClick: handleCopyMarkdown,
    className: "flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
  }, /*#__PURE__*/React.createElement(Copy, {
    className: "w-3.5 h-3.5"
  }), "Copy Markdown")), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
  }, "Close SitRep"))));
}

// ============================================================================
// Hero Welcome View
// ============================================================================

function HeroView({
  ward,
  wardData,
  onEnter
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "hero min-h-screen bg-base-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-content text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-3xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "badge badge-primary gap-2 p-3 font-semibold mb-4 shadow-sm"
  }, /*#__PURE__*/React.createElement(Waves, {
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", null, "RainDrop — Municipal GIS Urban Flood Intelligence Platform")), /*#__PURE__*/React.createElement("h1", {
    className: "text-5xl font-extrabold md:text-7xl tracking-tight text-base-content"
  }, "Rain", /*#__PURE__*/React.createElement("span", {
    className: "text-primary"
  }, "Drop")), /*#__PURE__*/React.createElement("p", {
    className: "py-6 text-lg text-base-content/80 md:text-xl leading-relaxed"
  }, "A Next-Generation AI & GIS-Powered Multi-City Nowcasting System for creating intelligent, conflict-free municipal flood emergency responses and safe routing."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap justify-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onEnter,
    className: "btn btn-primary font-bold shadow-md cursor-pointer"
  }, "Explore RainDrop GIS Map"), /*#__PURE__*/React.createElement("button", {
    onClick: onEnter,
    className: "btn btn-outline btn-secondary font-bold cursor-pointer"
  }, "Open Operations Center")), /*#__PURE__*/React.createElement("div", {
    className: "mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card bg-base-100 shadow-md border border-base-300 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-primary font-bold text-sm mb-1"
  }, /*#__PURE__*/React.createElement(Activity, {
    className: "w-4 h-4"
  }), " Real-Time GIS Grid"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-base-content/70"
  }, "Sub-kilometer neighborhood spatial inundation tracking across 5 pilot wards.")), /*#__PURE__*/React.createElement("div", {
    className: "card bg-base-100 shadow-md border border-base-300 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-accent font-bold text-sm mb-1"
  }, /*#__PURE__*/React.createElement(Navigation, {
    className: "w-4 h-4"
  }), " Smart Elevation Routes"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-base-content/70"
  }, "Dynamic vehicle passability analysis avoiding submerged lowlands & subways.")), /*#__PURE__*/React.createElement("div", {
    className: "card bg-base-100 shadow-md border border-base-300 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-secondary font-bold text-sm mb-1"
  }, /*#__PURE__*/React.createElement(Zap, {
    className: "w-4 h-4"
  }), " Doppler Radar Nowcast"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-base-content/70"
  }, "T+3h high-resolution rainfall forecasts coupled with tidal outfall models."))))));
}
if (typeof window !== "undefined") {
  window.RainDrop = RainDrop;
  window.AquaSight = RainDrop; // Backward compatibility alias
  const mountReactApp = () => {
    const container = document.getElementById("root");
    if (container && typeof ReactDOM !== "undefined") {
      try {
        if (!container._reactRoot) {
          container._reactRoot = ReactDOM.createRoot(container);
        }
        container._reactRoot.render(React.createElement(RainDrop));
        console.log("RainDrop GIS app mounted successfully.");
      } catch (e) {
        console.error("RainDrop React mount error:", e);
      }
    }
  };
  mountReactApp();
  setTimeout(mountReactApp, 50);
  if (document.readyState !== "complete") {
    window.addEventListener("DOMContentLoaded", mountReactApp);
  }
}