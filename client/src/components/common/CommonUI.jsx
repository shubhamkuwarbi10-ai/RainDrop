// Toasts are announced to screen readers. Errors use role="alert" (assertive),
// everything else role="status" (polite), so a failed dispatch interrupts and a
// routine confirmation does not.
function ToastStack({ toasts }) {
    const toneClass = {
        error: "border-red-300 bg-red-50 text-red-900",
        success: "border-emerald-300 bg-emerald-50 text-emerald-900",
        info: "border-slate-300 bg-white text-slate-900",
    };
    return (
        <div className="fixed bottom-5 right-5 z-[960] flex flex-col gap-2 items-end max-w-[min(92vw,26rem)]">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    role={t.tone === "error" ? "alert" : "status"}
                    aria-live={t.tone === "error" ? "assertive" : "polite"}
                    className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200 ${toneClass[t.tone] || toneClass.info}`}
                >
                    <span className="text-sm font-medium leading-snug">{t.msg}</span>
                </div>
            ))}
        </div>
    );
}

/**
 * The one depth legend, driven by the shared risk scale.
 *
 * Each band shows its colour, its hatch pattern and its words, so the map is
 * readable without colour vision and in greyscale.
 */
function RiskLegend({ className = "" }) {
    return (
        <div className={`rounded-xl border border-slate-300 bg-white/95 p-2.5 ${className}`}>
            <h3 className="text-xs font-bold text-slate-900 mb-1.5">Water depth on the road</h3>
            <ul className="space-y-1">
                {RISK_BANDS.map((band) => (
                    <li key={band.key} className="flex items-center gap-2 text-xs text-slate-800">
                        <span
                            className="w-4 h-4 rounded border border-slate-400 shrink-0"
                            style={{ backgroundColor: band.fill }}
                            aria-hidden="true"
                        />
                        <span className="font-semibold">{band.label}</span>
                        <span className="text-slate-600">{band.depthText} · {band.plain}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function StatusPill({ busy, label = "Ready" }) {
    if (busy) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-medium text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Processing…
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {label}
        </span>
    );
}

function ToggleRow({ label, checked, onChange }) {
    return (
        <button
            onClick={onChange}
            className="w-full flex items-center justify-between py-2 group cursor-pointer"
            type="button"
        >
            <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                {label}
            </span>
            <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${checked ? "bg-indigo-600" : "bg-slate-700/80"
                    }`}
            >
                <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${checked ? "translate-x-4.5" : "translate-x-1"
                        }`}
                />
            </span>
        </button>
    );
}

function WaterDepthWave({ depth, maxDepth = 60 }) {
    const percentage = Math.min(100, Math.max(5, (depth / maxDepth) * 100));
    const color = depth < 15 ? "#10b981" : depth < 30 ? "#f59e0b" : "#f43f5e";

    return (
        <div className="relative w-full h-24 rounded-xl overflow-hidden bg-slate-900/90 border border-slate-700/60 flex items-end">
            <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
                <div className="border-b border-dashed border-slate-400 text-[9px] font-mono text-slate-400">60cm critical</div>
                <div className="border-b border-dashed border-slate-400 text-[9px] font-mono text-slate-400">30cm warning</div>
                <div className="text-[9px] font-mono text-slate-400">0cm clear</div>
            </div>

            <div
                className="w-full transition-all duration-700 relative overflow-hidden"
                style={{
                    height: `${percentage}%`,
                    backgroundColor: color,
                    opacity: 0.75,
                }}
            >
                <div
                    className="absolute top-0 left-0 right-0 h-3 opacity-80"
                    style={{
                        background: `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.6) 0%, transparent 80%)`,
                    }}
                />
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 text-center">
                    <span className="text-xl font-bold font-mono tracking-tight text-white">{depth} cm</span>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                        {depth < 15 ? "Low / Passable" : depth < 30 ? "Moderate Inundation" : "Submerged / Impassable"}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Metropolitan City Profiles (6 Pilot Metros)
// ============================================================================


function CityMonumentIcon({ city, className = "w-6 h-6" }) {
    if (city === "Chennai") {
        // Temple Gopuram / Central Station Silhouette
        return (
            <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3l3 4h-6l3-4z" />
                <path d="M12 7l-2 5h12l-2-5" />
                <path d="M9 12l-2 6h18l-2-6" />
                <path d="M6 18l-2 8h24l-2-8" />
                <path d="M13 26v-4a3 3 0 0 1 6 0v4" />
                <line x1="3" y1="29" x2="29" y2="29" />
                <line x1="16" y1="2" x2="16" y2="3" />
            </svg>
        );
    }
    if (city === "Mumbai") {
        // Gateway of India
        return (
            <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="10" width="22" height="18" rx="1" />
                <path d="M12 28v-9a4 4 0 0 1 8 0v9" />
                <path d="M5 10l3-5h16l3 5" />
                <circle cx="9" cy="7.5" r="1.5" />
                <circle cx="23" cy="7.5" r="1.5" />
                <line x1="3" y1="29" x2="29" y2="29" />
                <line x1="12" y1="14" x2="20" y2="14" />
            </svg>
        );
    }
    if (city === "Delhi") {
        // India Gate
        return (
            <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 6h18v4H7z" />
                <path d="M9 10v18M23 10v18" />
                <path d="M12 28v-10a4 4 0 0 1 8 0v10" />
                <line x1="5" y1="29" x2="27" y2="29" />
                <path d="M11 6l1-2h8l1 2" />
            </svg>
        );
    }
    if (city === "Bengaluru") {
        // Vidhana Soudha
        return (
            <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4z" />
                <rect x="6" y="11" width="20" height="16" />
                <path d="M13 27v-7a3 3 0 0 1 6 0v7" />
                <line x1="10" y1="15" x2="10" y2="23" />
                <line x1="22" y1="15" x2="22" y2="23" />
                <line x1="3" y1="29" x2="29" y2="29" />
            </svg>
        );
    }
    if (city === "Kolkata") {
        // Howrah Bridge
        return (
            <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 25l6-16 6 6 6-6 6 16" />
                <line x1="10" y1="9" x2="10" y2="25" />
                <line x1="22" y1="9" x2="22" y2="25" />
                <line x1="2" y1="25" x2="30" y2="25" />
                <line x1="2" y1="28" x2="30" y2="28" strokeDasharray="2 2" />
            </svg>
        );
    }
    // Hyderabad - Charminar
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="12" width="16" height="15" />
            <path d="M12 27v-8a4 4 0 0 1 8 0v8" />
            <path d="M7 6v21M25 6v21" />
            <circle cx="7" cy="5" r="1.5" />
            <circle cx="25" cy="5" r="1.5" />
            <line x1="4" y1="29" x2="28" y2="29" />
        </svg>
    );
}


function RainDropLogo({ className = "w-7 h-7", textClassName = "text-lg font-bold text-white tracking-tight" }) {
    return (
        <div className="flex items-center gap-2.5 group cursor-pointer select-none">
            <div className="relative flex items-center justify-center">
                <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="dropGrad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#38BDF8" />
                            <stop offset="50%" stopColor="#2563EB" />
                            <stop offset="100%" stopColor="#1D4ED8" />
                        </linearGradient>
                        <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284C7" floodOpacity="0.5" />
                        </filter>
                    </defs>
                    <path
                        d="M16 3C16 3 6 15.5 6 21.5C6 26.5 10.5 30 16 30C21.5 30 26 26.5 26 21.5C26 15.5 16 3 16 3Z"
                        fill="url(#dropGrad)"
                        filter="url(#dropGlow)"
                    />
                    <path
                        d="M16 6.5C16 6.5 10 16 10 21C10 23.5 11.5 25.5 13.5 26.5C12 25 11.2 23 11.2 20.8C11.2 16.5 16 9 16 6.5Z"
                        fill="white"
                        fillOpacity="0.4"
                    />
                </svg>
            </div>
            <span className={textClassName}>
                RainDrop <span className="font-light tracking-normal opacity-90">GIS</span>
            </span>
        </div>
    );
}


function MapStandbyDeck({ wardData, floodStats, onEnableMap }) {
    return (
        <div className="relative rounded-lg border border-white/20 bg-zinc-950 p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl overflow-hidden min-h-[480px]">
            <div className="relative z-10 grid place-items-center w-16 h-16 rounded-lg bg-zinc-900 border border-white/30 text-white mb-5 shadow-lg">
                <MapPin className="w-8 h-8 text-white" />
            </div>

            <div className="relative z-10 max-w-md space-y-2">
                <span className="text-[11px] uppercase font-bold tracking-widest text-zinc-300 bg-zinc-900 px-3 py-1 rounded-md border border-white/20">
                    Spatial Map Standby Mode
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight pt-1">
                    {wardData.name} Flood Map
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                    Interactive spatial map visualization is currently hidden. Click the button below to load the live spatial flood grid, depth gauges, and safe corridor routing.
                </p>
            </div>

            {/* Primary Enable Button */}
            <div className="relative z-10 mt-7 flex flex-col sm:flex-row items-center gap-3">
                <button
                    onClick={onEnableMap}
                    className="group flex items-center gap-3 px-8 py-3.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold border border-white shadow-lg transition-all cursor-pointer"
                    type="button"
                >
                    <Power className="w-4 h-4 fill-current text-zinc-950" />
                    <span>🗺️ View Interactive Map</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </div>

            <div className="relative z-10 mt-8 grid grid-cols-3 gap-3 w-full max-w-md border-t border-zinc-800 pt-5 text-xs">
                <div className="p-3 rounded-md bg-zinc-900 border border-zinc-800 text-center">
                    <span className="block text-[10px] text-zinc-400 font-mono uppercase">Monitored Sectors</span>
                    <span className="font-bold text-white font-mono text-sm">{wardData.sectors.length} Nodes</span>
                </div>
                <div className="p-3 rounded-md bg-zinc-900 border border-red-500/40 text-center">
                    <span className="block text-[10px] text-red-300 font-mono uppercase">Flooded / Impassable</span>
                    <span className="font-bold text-red-400 font-mono text-sm">{floodStats.critical} High Risk</span>
                </div>
                <div className="p-3 rounded-md bg-zinc-900 border border-emerald-500/40 text-center">
                    <span className="block text-[10px] text-emerald-300 font-mono uppercase">Clear / Passable</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">{floodStats.clear} Clear</span>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Top Navbar & Controls
// ============================================================================

// ============================================================================
// Top Navbar & Controls
// ============================================================================


function EmergencyBanner({ wardData, floodStats, timeStep, onInspectHotspot }) {
    const isHighRisk = floodStats.critical > 2;

    return (
        <div
            className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm ${
                isHighRisk
                    ? "border-red-200 bg-red-50 text-red-950"
                    : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
        >
            <div className="flex items-center gap-2.5">
                <AlertOctagon className={`w-4 h-4 shrink-0 ${isHighRisk ? "text-red-600" : "text-amber-600"}`} />
                <span className="text-xs font-bold tracking-wide">
                    {isHighRisk
                        ? `🚨 PUBLIC EMERGENCY WATCH: ${wardData.riverName} approaching alert stage (${wardData.riverLevel}m). ${floodStats.critical} hotspots IMPASSABLE.`
                        : `⚠️ MONSOON ADVISORY: Drainage pumps operating at ${wardData.activePumps} capacity. Waterlogging monitored in lowlands.`}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onInspectHotspot}
                    className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer border border-blue-700 shadow-sm"
                >
                    <Eye className="w-3.5 h-3.5 text-white" />
                    <span>🗺️ Open Interactive Map</span>
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Interactive Vector & Geospatial Map
// ============================================================================
