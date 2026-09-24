function DeveloperSocialSection({ isVisible = false, onClose }) {
    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-2xl w-full text-white shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold font-mono">
                        RD
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Lead Engineer &amp; Intelligence Profiles</h3>
                        <p className="text-xs text-slate-400 font-mono">RainDrop Urban Water GIS Intelligence Engine</p>
                    </div>
                </div>
                
                {/* Social Profiles Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                    <a 
                        href="https://leetcode.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 transition-all flex flex-col items-center text-center group"
                    >
                        <span className="text-amber-400 font-bold text-xs uppercase font-mono">LeetCode</span>
                        <span className="text-[11px] text-slate-400 mt-1 group-hover:text-white transition-colors">Algorithms &amp; System</span>
                    </a>
                    <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 transition-all flex flex-col items-center text-center group"
                    >
                        <span className="text-sky-400 font-bold text-xs uppercase font-mono">GitHub</span>
                        <span className="text-[11px] text-slate-400 mt-1 group-hover:text-white transition-colors">GIS &amp; ML Pipelines</span>
                    </a>
                    <a 
                        href="https://linkedin.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-blue-400 transition-all flex flex-col items-center text-center group"
                    >
                        <span className="text-blue-400 font-bold text-xs uppercase font-mono">LinkedIn</span>
                        <span className="text-[11px] text-slate-400 mt-1 group-hover:text-white transition-colors">Engineering Network</span>
                    </a>
                    <a 
                        href="https://twitter.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 transition-all flex flex-col items-center text-center group"
                    >
                        <span className="text-cyan-400 font-bold text-xs uppercase font-mono">Twitter / X</span>
                        <span className="text-[11px] text-slate-400 mt-1 group-hover:text-white transition-colors">Radar &amp; Builds</span>
                    </a>
                </div>

                {/* Confirmed Project Specs & Data */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
                    <div className="flex justify-between text-sky-400 font-bold border-b border-slate-800 pb-1.5">
                        <span>CONFIRMED PROJECT METRICS</span>
                        <span>v3.4-PROD</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Elevation Dataset:</span>
                        <span className="text-slate-200">16-bit Sub-meter High Precision DEM</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Hydro Inundation Engine:</span>
                        <span className="text-emerald-400">ML Surrogate + 2D Hydrodynamic Models</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Monitored Metros:</span>
                        <span className="text-slate-200">6 Indian Basins (Chennai, Mumbai, Kolkata, Delhi, Bengaluru, Hyderabad)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


function DataLayersModal({ isOpen, onClose, mapToggles, setMapToggles, pushToast }) {
    if (!isOpen) return null;

    const layersConfig = [
        {
            id: "hotspots",
            name: "Critical Flood Hotspots",
            badge: "CartoDEM 30m Grid",
            badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
            source: "ISRO CartoDEM Elevation + Municipal Sump Gauges",
            frequency: "Continuous (60s cycle)",
            description: "Real-time surface water depth computed from rainfall accumulation and elevation runoff.",
        },
        {
            id: "pumps",
            name: "Stormwater Dewatering Pumps",
            badge: "SCADA Telemetry",
            badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
            source: "Municipal Stormwater Drainage Operations (BMC / GCC)",
            frequency: "Live telemetry (active suction & diesel standby)",
            description: "High-capacity submersible dewatering pump locations and active capacity percentages.",
        },
        {
            id: "shelters",
            name: "Relief & Evacuation Shelters",
            badge: "Disaster Authority",
            badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
            source: "State Disaster Management Authority (SDMA / NDRF)",
            frequency: "Updated per flood shift",
            description: "Verified community schools and disaster halls with dry rations, medical kits, and boat staging.",
        },
        {
            id: "metro",
            name: "Transit & Metro Corridors",
            badge: "Road Network",
            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
            source: "Metropolitan Transit Police & Rail GIS Feeds",
            frequency: "Real-time incident updates",
            description: "Subway gate closure advisories and elevated highway safe-elevation corridors.",
        },
        {
            id: "boundaries",
            name: "Municipal Ward Catchments",
            badge: "Survey of India",
            badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
            source: "Municipal Administrative GIS Polygons",
            frequency: "Static hydro-basin boundaries",
            description: "Natural drainage basins and administrative municipal ward boundary borders.",
        }
    ];

    const toggleLayer = (id) => {
        const nextState = !mapToggles[id];
        setMapToggles((prev) => ({ ...prev, [id]: nextState }));
        if (pushToast) {
            pushToast(`Layer "${layersConfig.find(l => l.id === id)?.name}" ${nextState ? "enabled" : "hidden"}`);
        }
    };

    return (
        <div className="fixed inset-0 z-[960] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
            <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                GIS Telemetry Overlays
                            </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-900 mt-1">Data Layers &amp; Sensor Sources</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Toggle live spatial data layers and inspect their verification authorities.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {layersConfig.map((layer) => {
                        const active = !!mapToggles[layer.id];
                        return (
                            <div
                                key={layer.id}
                                className={`p-4 rounded-2xl border transition-all ${
                                    active
                                        ? "bg-slate-50/80 border-slate-200 shadow-2xs"
                                        : "bg-white border-slate-100 opacity-60 hover:opacity-100"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-900">{layer.name}</span>
                                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${layer.badgeColor}`}>
                                                {layer.badge}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                            {layer.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10.5px] text-slate-400">
                                            <span>Authority: <strong className="text-slate-600">{layer.source}</strong></span>
                                            <span>Frequency: <strong className="text-slate-600">{layer.frequency}</strong></span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleLayer(layer.id)}
                                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                                            active ? "bg-blue-600" : "bg-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-1 ${
                                                active ? "right-1" : "left-1"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                        Active Overlays: <strong className="text-slate-900 font-bold">{Object.values(mapToggles).filter(Boolean).length} / 5</strong>
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Situation Report (SitRep) Modal
// ============================================================================

function SitRepModal({ ward, wardData, floodStats, sectorDepths, timeStep, scenario, onClose, pushToast }) {
    const currentForecast = HYDROGRAPH_DATA[timeStep] || HYDROGRAPH_DATA[0];
    const wardName = ward || "Kurla";
    const data = wardData || {
        code: "KW-10",
        riskLevel: "High Risk",
        activePumps: 12,
        riverName: "Mithi River",
        riverLevel: "3.42",
        dangerLevel: "3.00",
        evacShelters: "4 Nodal Centers",
    };
    const stats = floodStats || { critical: 6, caution: 4, clear: 14 };

    const handlePrint = () => {
        window.print();
    };

    const handleCopyMarkdown = () => {
        const text = `# RAINDROP MUNICIPAL SITUATION REPORT (SITREP)
**Ward:** ${wardName} (${data.code})
**Timestamp:** ${new Date().toLocaleString()} | Horizon: ${currentForecast.t} (${currentForecast.label})
**Overall Risk Status:** ${data.riskLevel}

## Flood Impact Metrics
- Critical / Inundated Sectors (>30cm): ${stats.critical}
- Caution / Waterlogged Sectors (15-30cm): ${stats.caution}
- Clear / Passable Corridors: ${stats.clear}
- Active Drainage Pumps: ${data.activePumps}
- River Stage: ${data.riverName} at ${data.riverLevel}m (Danger Level: ${data.dangerLevel}m)
- Emergency Shelters: ${data.evacShelters}

## Incident Commander Directives
1. Deploy mobile dewatering units to lowest elevation sectors in ${wardName}.
2. Divert commuter transit along designated Safe Elevation Corridors via Kalina CST Flyover Upper Deck.
3. Lower subway and underpass gates at critical waterlogged bottlenecks (Bail Bazar & Station West).
4. Keep all ${data.activePumps} stormwater dewatering stations on continuous suction with auxiliary diesel backup.
`;
        navigator.clipboard.writeText(text).then(() => {
            if (pushToast) {
                pushToast("SitRep Copied", "Markdown format ready for municipal dispatch.", "success");
            }
        });
    };

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(8px)" }}
        >
            <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl p-7 text-slate-900 font-sans animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800">
                                    Official Incident Dispatch · BMC / NDRF
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                                RainDrop Municipal Situation Report (SitRep)
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {wardName} · {data.code} · Generated {new Date().toLocaleTimeString()} · Horizon: {currentForecast.t} ({currentForecast.label})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                        title="Close SitRep"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
                        <span className="text-[10.5px] font-bold text-rose-700 uppercase tracking-wider block">Flooded Sectors</span>
                        <p className="text-2xl font-bold text-rose-900 mt-1">{stats.critical}</p>
                        <span className="text-[10px] text-rose-600 font-medium block mt-0.5">Roads submerged &gt;30cm</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                        <span className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider block">Passable Corridors</span>
                        <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.clear}</p>
                        <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">Dry elevation routes</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
                        <span className="text-[10.5px] font-bold text-sky-700 uppercase tracking-wider block">River Spillway</span>
                        <p className="text-2xl font-bold text-sky-900 mt-1">{data.riverLevel}m</p>
                        <span className="text-[10px] text-sky-600 font-medium block mt-0.5">Alert limit: {data.dangerLevel}m ({data.riverName})</span>
                    </div>
                </div>

                {/* Directives Section */}
                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-blue-600" />
                            Incident Commander Directives
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            High Priority
                        </span>
                    </div>
                    <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 leading-relaxed">
                        <li>Subway and underpass gates closed at <strong>Bail Bazar</strong> and <strong>Kurla Station West</strong> to prevent entrapment.</li>
                        <li>Direct civilian and emergency transit along designated <strong>Safe Elevation Corridors</strong> via CST Flyover Upper Deck.</li>
                        <li>All <strong>{data.activePumps}</strong> high-capacity stormwater pumps energized on continuous suction with auxiliary diesel standby.</li>
                        <li>Disaster management rescue teams and NDRF personnel staged at <strong>{data.evacShelters}</strong> with dry rations and inflatable boats.</li>
                    </ul>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer transition-colors"
                        >
                            <Printer className="w-4 h-4 text-slate-500" />
                            Print SitRep
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyMarkdown}
                            className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer transition-colors"
                        >
                            <Copy className="w-4 h-4 text-slate-500" />
                            Copy Markdown
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-colors"
                    >
                        Close SitRep
                    </button>
                </div>
            </div>
        </div>
    );
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
                    container._reactRoot.render(React.createElement(RainDrop));
                    console.log("RainDrop GIS app mounted successfully.");
                }
            } catch (e) {
                console.error("RainDrop React mount error:", e);
            }
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountReactApp);
    } else {
        mountReactApp();
    }
}
