function RainDrop() {
    const [view, setView] = useState("hero"); // 'hero' (Editorial Landing) | 'overview' (3:7 City & Ward Matrix) | 'command' (Operations Center Map)
    const [activeTab, setActiveTab] = useState("telemetry"); // 'telemetry' | 'routes' | 'scenario' | 'map'
    const [selectedCity, setSelectedCity] = useState("Chennai"); // Default city displayed in top bar
    const [ward, setWard] = useState("Velachery");
    const [wardOpen, setWardOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [gisSpecsModalOpen, setGisSpecsModalOpen] = useState(false);
    const [sitRepOpen, setSitRepOpen] = useState(false);
    const [selectedSector, setSelectedSector] = useState(null);
    const [dataLayersModalOpen, setDataLayersModalOpen] = useState(false);
    const [riverCardMinimized, setRiverCardMinimized] = useState(false);

    // Hover-Collapsible Sidebar State
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(false);

    useEffect(() => {
        window._openGisSpecsModal = () => setGisSpecsModalOpen(true);
        return () => {
            delete window._openGisSpecsModal;
        };
    }, []);

    // Layout & Replica States
    const [mapStyle, setMapStyle] = useState("Map"); // 'Map' | 'Satellite' | 'Terrain'
    const [mapToggles, setMapToggles] = useState({
        hotspots: true,
        pumps: true,
        shelters: false,
        metro: true,
        boundaries: false,
    });
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
    const cityDropdownRef = useRef(null);
    const wardDropdownRef = useRef(null);

    // Global outside-click listener for header dropdowns
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
                setCityDropdownOpen(false);
            }
            if (wardDropdownRef.current && !wardDropdownRef.current.contains(e.target)) {
                setWardDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Global bridge for Leaflet popup button to open Sector Drawer
    useEffect(() => {
        window._openSectorDrawer = (idx) => {
            setSelectedSector(idx);
        };
        return () => {
            delete window._openSectorDrawer;
        };
    }, []);

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const [timelineIndex, setTimelineIndex] = useState(1); // 0=Now, 1=+1h, 2=+3h, 3=+6h, 4=+12h
    const [activeNav, setActiveNav] = useState("overview"); // 'overview' | 'simulate' | 'routes' | 'layers' | 'reports'
    const [simulationModalOpen, setSimulationModalOpen] = useState(false);
    const [rightCardCollapsed, setRightCardCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef(null);

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
        elevationContours: false,
    });

    // What-If Scenario Sliders
    const [scenario, setScenario] = useState({
        rainfallMultiplier: 1.0,
        tideOffset: 0,
        pumpEfficiency: 100,
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
    const [radarTime, setRadarTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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

    const pushToast = (msg) => {
        const id = ++toastId.current;
        setToasts((t) => [...t.slice(-1), { id, msg }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
    };

    // Fetch Live Real-Time ML Ward Forecast from FastAPI Backend
    const loadWardForecast = useCallback(async (targetWard = ward, targetCity = selectedCity) => {
        setIsFetchingForecast(true);
        try {
            const res = await fetch(`/api/ward_forecast?ward_name=${encodeURIComponent(targetWard)}&city=${encodeURIComponent(targetCity)}`);
            if (res.ok) {
                const data = await res.json();
                setLiveForecast(data);
                setRadarTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                
                if (data.prediction && data.prediction.timeseries_mm_hr && data.prediction.timeseries_mm_hr.length > 0) {
                    const newHydro = data.prediction.timeseries_mm_hr.slice(0, 7).map((val, idx) => ({
                        t: data.prediction.timeseries_labels[idx] || `+${idx}h`,
                        rain: Math.round(val * 10) / 10,
                        surge: Number((1.2 + val * 0.05).toFixed(1)),
                        label: data.prediction.timeseries_labels[idx] || `+${idx}h Forecast`
                    }));
                    setHydrograph(newHydro);
                }
            }
        } catch (err) {
            console.warn("Backend API sync offline, using local model state:", err);
        } finally {
            setIsFetchingForecast(false);
        }
    }, [ward, selectedCity]);

    useEffect(() => {
        loadWardForecast(ward, selectedCity);
        const pollId = setInterval(() => loadWardForecast(ward, selectedCity), 30000);
        return () => clearInterval(pollId);
    }, [ward, selectedCity, loadWardForecast]);

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
        const id = setInterval(() => setUpdatedAgo((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setTimeStep((prev) => (prev >= hydrograph.length - 1 ? 0 : prev + 1));
        }, 2400 / playSpeed);
        return () => clearInterval(interval);
    }, [isPlaying, playSpeed, hydrograph]);

    useEffect(() => {
        if (!isSimulatingRoute) return;
        setRouteProgress(0);
        const interval = setInterval(() => {
            setRouteProgress((p) => {
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

    const currentWardData = useMemo(() => {
        const base = WARDS_DATA[ward] || WARDS_DATA["Velachery"] || Object.values(WARDS_DATA)[0];
        if (!liveForecast || liveForecast.ward_name !== base.name) return base;
        return {
            ...base,
            riverLevel: liveForecast.river_level_m !== undefined ? liveForecast.river_level_m : base.riverLevel,
            rainfallForecast: liveForecast.rainfall_forecast_mm !== undefined ? `${liveForecast.rainfall_forecast_mm} mm` : base.rainfallForecast,
            activePumps: liveForecast.active_pumps || base.activePumps,
            riskLevel: liveForecast.status || base.riskLevel,
        };
    }, [ward, liveForecast]);

    const sectorDepths = useMemo(() => {
        const predDepth = (liveForecast && liveForecast.predicted_flood_depth_cm !== undefined) ? liveForecast.predicted_flood_depth_cm : null;
        const livePeak = (liveForecast && liveForecast.prediction && liveForecast.prediction.peak_intensity_mm_hr) || 15;
        const rainRatio = Math.max(0.1, livePeak / 30.0);
        const timeMultiplier = (timeStep * 0.35) + 0.65;
        const rainFactor = scenario.rainfallMultiplier * (rainRatio > 0 ? rainRatio : 1.0);
        const tideFactor = 1 + (scenario.tideOffset * 0.25);
        const pumpFactor = 1.3 - (scenario.pumpEfficiency / 100) * 0.4;

        return currentWardData.sectors.map((sec) => {
            if (predDepth !== null && predDepth > 0) {
                const elevAdjustment = Math.max(-8, Math.min(8, 6.0 - sec.elevation));
                const calc = Math.round(Math.max(0, (predDepth + elevAdjustment) * timeMultiplier * rainFactor * tideFactor * pumpFactor));
                return calc;
            }
            const calc = Math.round(
                sec.baseDepth * timeMultiplier * rainFactor * tideFactor * pumpFactor - (sec.elevation * 0.8)
            );
            return Math.max(0, calc);
        });
    }, [currentWardData, timeStep, scenario, liveForecast]);

    const floodStats = useMemo(() => {
        let clear = 0;
        let caution = 0;
        let critical = 0;
        sectorDepths.forEach((d) => {
            if (d < 15) clear++;
            else if (d < 30) caution++;
            else critical++;
        });
        return { clear, caution, critical };
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
            setNowcastResult({ status: "ERROR", message: err.message });
            pushToast("Nowcast pipeline call failed — backend offline?");
        } finally {
            setNowcastBusy(false);
        }
    };

    // --- Route Check API Call ---
    const handleRouteCheck = async (e) => {
        e.preventDefault();
        if (!routeOrigin.trim() || !routeDest.trim()) return;
        setRouteCheckBusy(true);
        setRouteCheckResult(null);
        try {
            const params = new URLSearchParams({
                origin: routeOrigin,
                destination: routeDest,
                depth_cm: routeDepth,
            });
            const res = await fetch(`/api/route_check?${params}`);
            const data = await res.json();
            setRouteCheckResult(data);
            pushToast(`Route safety check complete: ${(data && data.standard_route && data.standard_route.status) || "DONE"}`);
        } catch (err) {
            setRouteCheckResult({ error: err.message });
            pushToast("Route check failed — backend offline?");
        } finally {
            setRouteCheckBusy(false);
        }
    };

    // Search Filter Logic for instant location/ward/landmark finder
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        const results = [];

        Object.keys(WARDS_DATA).forEach((wKey) => {
            const w = WARDS_DATA[wKey];
            if (
                w.name.toLowerCase().includes(q) ||
                w.city.toLowerCase().includes(q) ||
                (w.code && w.code.toLowerCase().includes(q))
            ) {
                results.push({
                    type: "ward",
                    title: w.name,
                    subtitle: `${w.city} • ${w.code || "Municipal Zone"}`,
                    wardKey: wKey,
                    city: w.city,
                    coords: [w.coords?.lat || 19.0728, w.coords?.lng || 72.8797],
                });
            }
            if (w.sectors) {
                w.sectors.forEach((sec, idx) => {
                    if (sec.name.toLowerCase().includes(q) || (sec.risk && sec.risk.toLowerCase().includes(q))) {
                        results.push({
                            type: "hotspot",
                            title: sec.name,
                            subtitle: `${w.name}, ${w.city} • Hotspot (${sec.risk})`,
                            wardKey: wKey,
                            city: w.city,
                            sectorIdx: idx,
                            coords: [sec.coords?.lat || 19.0728, sec.coords?.lng || 72.8797],
                        });
                    }
                });
            }
        });
        return results.slice(0, 8);
    }, [searchQuery]);

    const handleSelectSearchResult = (res) => {
        if (res.city) setSelectedCity(res.city);
        if (res.wardKey) setWard(res.wardKey);
        if (res.sectorIdx !== undefined) setSelectedSector(res.sectorIdx);
        setSearchOpen(false);
        setSearchQuery("");
        if (window._rainDropMap && res.coords) {
            window._rainDropMap.flyTo(res.coords, 15, { duration: 1.2 });
        }
        pushToast(`Focused on ${res.title}`);
    };

    // Keyboard shortcut for Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // VIEW 1: Public Hero Landing Page (Editorial Light Sea Blue GIS Theme)
    if (view === "hero") {
        return (
            <div className="min-h-screen w-full bg-white text-slate-900 selection:bg-emerald-600 selection:text-white font-sans antialiased overflow-x-hidden">
                <ToastStack toasts={toasts} />
                <HeroView
                    ward={ward}
                    wardData={currentWardData}
                    onEnter={() => {
                        setView("overview");
                    }}
                    onSelectCity={(cityName) => {
                        setSelectedCity(cityName);
                        const cityWards = Object.keys(WARDS_DATA).filter((w) => WARDS_DATA[w].city.toLowerCase() === cityName.toLowerCase());
                        const firstWard = cityWards[0] || Object.keys(WARDS_DATA)[0];
                        setWard(firstWard);
                        setSelectedSector(null);
                        loadWardForecast(firstWard, cityName);
                        setView("overview");
                    }}
                    onOpenMap={(targetWard, targetCity) => {
                        if (targetCity) setSelectedCity(targetCity);
                        if (targetWard) setWard(targetWard);
                        setIsMapEnabled(true);
                        setView("command");
                    }}
                    pushToast={pushToast}
                />
            </div>
        );
    }

    // VIEW 2: 3:7 Split City & Ward Intelligence Matrix Overview
    if (view === "overview") {
        return (
            <div className="h-screen w-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white font-sans overflow-hidden flex flex-col">
                <ToastStack toasts={toasts} />
                {sitRepOpen && (
                    <SitRepModal
                        ward={ward}
                        wardData={currentWardData}
                        floodStats={floodStats}
                        sectorDepths={sectorDepths}
                        timeStep={timeStep}
                        scenario={scenario}
                        onClose={() => setSitRepOpen(false)}
                        pushToast={pushToast}
                    />
                )}
                <CityWardOverview
                    selectedCity={selectedCity}
                    setSelectedCity={(c) => {
                        setSelectedCity(c);
                        const cityWards = Object.keys(WARDS_DATA).filter((w) => WARDS_DATA[w].city.toLowerCase() === c.toLowerCase());
                        const firstWard = cityWards[0] || Object.keys(WARDS_DATA)[0];
                        setWard(firstWard);
                        setSelectedSector(null);
                        loadWardForecast(firstWard, c);
                    }}
                    ward={ward}
                    setWard={(w) => {
                        setWard(w);
                        setSelectedSector(null);
                        loadWardForecast(w, selectedCity);
                    }}
                    currentTime={currentTime}
                    liveForecast={liveForecast}
                    loadWardForecast={loadWardForecast}
                    isFetchingForecast={isFetchingForecast}
                    onOpenMap={(targetWard, targetCity) => {
                        if (targetCity) setSelectedCity(targetCity);
                        if (targetWard) setWard(targetWard);
                        setIsMapEnabled(true);
                        setView("command");
                        pushToast(`Opening GIS Map view for ${targetWard || ward} (${targetCity || selectedCity})`);
                    }}
                    onOpenSitRep={(targetWard) => {
                        if (targetWard) setWard(targetWard);
                        setSitRepOpen(true);
                    }}
                    onSwitchToHero={() => setView("hero")}
                    pushToast={pushToast}
                />
            </div>
        );
    }

    const isSidebarExpanded = sidebarHovered || sidebarPinned;

    return (
        <div className="h-screen w-screen bg-[#F8FAFC] text-slate-900 relative selection:bg-blue-600 selection:text-white font-sans overflow-hidden flex flex-col">
            <ToastStack toasts={toasts} />

            {selectedSector !== null && currentWardData?.sectors?.[selectedSector] && (
                <SectorDrawer
                    sector={currentWardData.sectors[selectedSector]}
                    depth={sectorDepths[selectedSector]}
                    wardName={ward}
                    onClose={() => setSelectedSector(null)}
                    pushToast={pushToast}
                />
            )}

            {/* GIS Data Layers & Provenance Modal */}
            <DataLayersModal
                isOpen={dataLayersModalOpen}
                onClose={() => {
                    setDataLayersModalOpen(false);
                    if (activeNav === "layers") setActiveNav("live");
                }}
                mapToggles={mapToggles}
                setMapToggles={setMapToggles}
                pushToast={pushToast}
            />

            {/* Dual Corridor Route Check Modal */}
            {routeCheckOpen && (
                <div
                    className="fixed inset-0 z-[900] flex items-center justify-center p-4"
                    style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(8px)" }}
                >
                    <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 text-slate-900 font-sans animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => {
                                setRouteCheckOpen(false);
                                setRouteCheckResult(null);
                            }}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                            type="button"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                                <Route className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    Dual-Corridor Safe Routing
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase">
                                        30m DEM High-Ground
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Bypasses inundated underpasses &amp; lowlands using surface elevation data
                                </p>
                            </div>
                        </div>

                        <form onSubmit={(e) => {
                            if (e.target._gotcha && e.target._gotcha.value) {
                                e.preventDefault();
                                return; // Silent discard of spam bot submissions
                            }
                            handleRouteCheck(e);
                        }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {/* Spam Bot Protection Honeypot Field */}
                            <input
                                type="text"
                                name="_gotcha"
                                style={{ display: 'none' }}
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                            />
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Origin Landmark</label>
                                <input
                                    value={routeOrigin}
                                    onChange={(e) => setRouteOrigin(e.target.value)}
                                    placeholder="e.g. Kurla Station"
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Destination</label>
                                <input
                                    value={routeDest}
                                    onChange={(e) => setRouteDest(e.target.value)}
                                    placeholder="e.g. BKC Connector"
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    Simulated Flood Water Depth (cm)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    step="1"
                                    value={routeDepth}
                                    onChange={(e) => setRouteDepth(Number(e.target.value))}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                                />
                            </div>
                            <div className="sm:col-span-2 mt-1">
                                <button
                                    type="submit"
                                    disabled={routeCheckBusy}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {routeCheckBusy ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing 30m Elevation Corridors…
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" /> Check Dual-Corridor Safety
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {routeCheckResult && !routeCheckResult.error && (
                            <div className="space-y-3 border-t border-slate-100 pt-4">
                                <div className="rounded-2xl p-3.5 bg-rose-50 border border-rose-200 text-rose-900">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold flex items-center gap-1.5 text-rose-700">
                                            🔴 Standard Direct Route
                                        </span>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                                            {routeCheckResult.standard_route?.status_label || "HAZARDOUS"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 my-2">
                                        <div>
                                            Distance: <strong className="text-slate-900">{routeCheckResult.standard_route?.distance_km} km</strong>
                                        </div>
                                        <div>
                                            Travel: <strong className="text-slate-900">{routeCheckResult.standard_route?.est_time_min} mins</strong>
                                        </div>
                                        <div>
                                            Max Flood: <strong className="text-rose-600">🌊 {routeCheckResult.standard_route?.max_water_depth_cm} cm</strong>
                                        </div>
                                    </div>
                                    {routeCheckResult.standard_route?.danger_points?.[0] && (
                                        <div className="text-[10px] text-rose-800 bg-rose-100/80 px-2.5 py-1.5 rounded-xl">
                                            ⚠️ <strong>Hazard Bottleneck:</strong> {routeCheckResult.standard_route.danger_points[0].name} ({routeCheckResult.standard_route.danger_points[0].hazard})
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-2xl p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-700">
                                            🟢 Safe Elevation Corridor (Recommended)
                                        </span>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                                            {routeCheckResult.safe_corridor?.status_label || "SAFE PASSAGE"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 my-2">
                                        <div>
                                            Distance: <strong className="text-slate-900">{routeCheckResult.safe_corridor?.distance_km} km</strong>
                                        </div>
                                        <div>
                                            Travel: <strong className="text-slate-900">{routeCheckResult.safe_corridor?.est_time_min} mins</strong>
                                        </div>
                                        <div>
                                            Max Flood: <strong className="text-emerald-600">🌊 {routeCheckResult.safe_corridor?.max_water_depth_cm} cm</strong>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-emerald-800 bg-emerald-100/80 px-2.5 py-1.5 rounded-xl">
                                        <span>🛡️ <strong>Highland Bypass:</strong> Elevated Flyover Route</span>
                                        <span className="font-bold">+{routeCheckResult.safe_corridor?.detour_time_min} min detour (+{routeCheckResult.safe_corridor?.detour_dist_km} km)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {routeCheckResult && routeCheckResult.error && (
                            <p className="mt-3 text-xs text-rose-500 font-semibold">{routeCheckResult.error}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Run Flood Simulation What-If Modal */}
            {simulationModalOpen && (
                <div
                    className="fixed inset-0 z-[900] flex items-center justify-center p-4"
                    style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(8px)" }}
                >
                    <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 text-slate-900 font-sans animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSimulationModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                                <Play className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    Hydrodynamic What-If Simulation
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase">
                                        AI Surrogate Model
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Simulate intense precipitation pulses and ocean high-tide gate backflow
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    Rainfall Intensity Scenario
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: "Normal Rain", val: 20, desc: "20 mm/hr" },
                                        { label: "Heavy Monsoon", val: 50, desc: "50 mm/hr" },
                                        { label: "Severe Storm", val: 100, desc: "100 mm/hr" },
                                        { label: "Cloudburst Pulse", val: 150, desc: "150 mm/hr" },
                                    ].map((scen) => (
                                        <button
                                            key={scen.val}
                                            type="button"
                                            onClick={() => {
                                                setScenario((prev) => ({ ...prev, rainfallMm: scen.val }));
                                                pushToast(`Scenario selected: ${scen.label} (${scen.desc})`);
                                            }}
                                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                                scenario.rainfallMm === scen.val
                                                    ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200"
                                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                            }`}
                                        >
                                            <div className="text-xs font-bold">{scen.label}</div>
                                            <div className="text-[11px] text-slate-400">{scen.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200/90 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-slate-800">High Tide Barrier Backflow</div>
                                    <div className="text-[11px] text-slate-500">Mithi River outfall throttled (+3.4m tide)</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setScenario((prev) => ({
                                            ...prev,
                                            highTideM: prev.highTideM > 0 ? 0 : 3.4,
                                        }))
                                    }
                                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                                        scenario.highTideM > 0 ? "bg-indigo-600" : "bg-slate-300"
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                                            scenario.highTideM > 0 ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-blue-600" /> Projected Hydrologic Inundation
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-blue-800 pt-1">
                                    <div>
                                        Est. Runoff: <strong>{(scenario.rainfallMm * 1.8).toFixed(1)} MLD</strong>
                                    </div>
                                    <div>
                                        Peak River Stage: <strong>{(2.1 + scenario.rainfallMm * 0.015 + scenario.highTideM * 0.35).toFixed(2)} m</strong>
                                    </div>
                                    <div>
                                        Critical Hotspots: <strong>{scenario.rainfallMm >= 100 ? "6 impassable" : "2 cautious"}</strong>
                                    </div>
                                    <div>
                                        Pump Capacity: <strong>{scenario.pumpEfficiency}%</strong>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSimulationModalOpen(false);
                                    setTimeStep(2);
                                    setTimelineIndex(2);
                                    pushToast("Simulation Applied", "Interactive map updated with pulse forecast.", "success");
                                }}
                                className="w-full py-3 rounded-2xl bg-[#0F2942] hover:bg-[#163A5E] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span>Apply Scenario To Map</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Situation Report Modal */}
            {sitRepOpen && (
                <SitRepModal
                    ward={ward}
                    wardData={currentWardData}
                    floodStats={floodStats}
                    sectorDepths={sectorDepths}
                    timeStep={timeStep}
                    scenario={scenario}
                    onClose={() => setSitRepOpen(false)}
                    pushToast={pushToast}
                />
            )}

            {/* ========================================================================= */}
            {/* EXACT REPLICA: RainDrop Live Operations Center / Municipal Intelligence  */}
            {/* ========================================================================= */}
            <div className="flex-1 flex w-full h-full overflow-hidden">
                {/* LEFT SIDEBAR WITH HOVER COLLAPSIBLE ACTION RAIL */}
                <aside
                    onMouseEnter={() => {
                        setSidebarHovered(true);
                        setTimeout(() => {
                            if (window._rainDropMap) window._rainDropMap.invalidateSize();
                        }, 320);
                    }}
                    onMouseLeave={() => {
                        setSidebarHovered(false);
                        setTimeout(() => {
                            if (window._rainDropMap) window._rainDropMap.invalidateSize();
                        }, 320);
                    }}
                    className={`bg-white border-r border-slate-200/80 h-full flex flex-col p-3.5 z-30 shrink-0 select-none overflow-y-auto transition-all duration-300 ease-in-out shadow-sm ${
                        isSidebarExpanded ? "w-72" : "w-[68px]"
                    }`}
                >
                    <div className="flex flex-col h-full">
                        {/* Brand Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div 
                                className={`flex items-center gap-2.5 cursor-pointer group ${!isSidebarExpanded ? "mx-auto" : ""}`}
                                onClick={() => setView("overview")}
                                title="Switch to 3:7 City Overview Matrix"
                            >
                                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                                    <Droplets className="w-4 h-4 text-white" />
                                </div>
                                {isSidebarExpanded && (
                                    <div className="animate-in fade-in duration-200">
                                        <h1 className="text-[17px] font-bold tracking-tight text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                            RainDrop
                                        </h1>
                                        <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">
                                            Operations Map
                                        </p>
                                    </div>
                                )}
                            </div>

                            {isSidebarExpanded && (
                                <button
                                    type="button"
                                    onClick={() => setSidebarPinned(!sidebarPinned)}
                                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                        sidebarPinned ? "bg-blue-50 text-blue-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                    }`}
                                    title={sidebarPinned ? "Sidebar Pinned Open" : "Pin Sidebar Open"}
                                >
                                    <Sliders className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Main Navigation Links */}
                        <nav className="mt-3 flex flex-col gap-1">
                            <button
                                onClick={() => setView("overview")}
                                className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                    !isSidebarExpanded ? "justify-center" : ""
                                } text-slate-700 hover:bg-slate-50 hover:text-blue-600`}
                                title="City & Ward Matrix Overview"
                            >
                                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                                {isSidebarExpanded && <span className="truncate">City Matrix</span>}
                            </button>

                            <button
                                onClick={() => setActiveNav("overview")}
                                className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                    !isSidebarExpanded ? "justify-center" : ""
                                } ${
                                    activeNav === "overview"
                                        ? "bg-[#EEF4FF] text-[#1D4ED8] border border-blue-100/80 shadow-2xs"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                                title="Live Map View"
                            >
                                <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                                {isSidebarExpanded && <span className="truncate">Live Map</span>}
                            </button>

                            <button
                                onClick={() => {
                                    setActiveNav("simulate");
                                    setSimulationModalOpen(true);
                                }}
                                className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                    !isSidebarExpanded ? "justify-center" : ""
                                } ${
                                    activeNav === "simulate"
                                        ? "bg-[#EEF4FF] text-[#1D4ED8] border border-blue-100/80 shadow-2xs"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                                title="Simulate Flood Event"
                            >
                                <Play className="w-4 h-4 text-slate-500 shrink-0" />
                                {isSidebarExpanded && <span className="truncate">Simulate</span>}
                            </button>

                            <button
                                onClick={() => {
                                    setActiveNav("routes");
                                    setRouteCheckOpen(true);
                                }}
                                className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                    !isSidebarExpanded ? "justify-center" : ""
                                } ${
                                    activeNav === "routes"
                                        ? "bg-[#EEF4FF] text-[#1D4ED8] border border-blue-100/80 shadow-2xs"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                                title="Safe Route Corridors"
                            >
                                <Navigation className="w-4 h-4 text-slate-500 shrink-0" />
                                {isSidebarExpanded && <span className="truncate">Safe Routes</span>}
                            </button>

                            <button
                                onClick={() => {
                                    setActiveNav("layers");
                                    setDataLayersModalOpen(true);
                                }}
                                className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                    !isSidebarExpanded ? "justify-center" : ""
                                } ${
                                    activeNav === "layers" || dataLayersModalOpen
                                        ? "bg-[#EEF4FF] text-[#1D4ED8] border border-blue-100/80 shadow-2xs"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                                title="GIS Data Layers"
                            >
                                <Layers className="w-4 h-4 text-slate-500 shrink-0" />
                                {isSidebarExpanded && <span className="truncate">Data Layers</span>}
                            </button>

                            <button
                                onClick={() => {
                                    setActiveNav("reports");
                                    setSitRepOpen(true);
                                }}
                                className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                    !isSidebarExpanded ? "justify-center" : ""
                                } ${
                                    activeNav === "reports"
                                        ? "bg-[#EEF4FF] text-[#1D4ED8] border border-blue-100/80 shadow-2xs"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                                title="SitRep Municipal Reports"
                            >
                                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                                {isSidebarExpanded && <span className="truncate">Reports</span>}
                            </button>
                        </nav>

                        {/* DEDICATED METROPOLITAN GRID & WARD SELECTOR (When expanded) */}
                        {isSidebarExpanded ? (
                            <div className="mt-4 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Metropolitan Zone</span>
                                    <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/80">6 Cities</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                                    {["Chennai", "Mumbai", "Delhi", "Bengaluru", "Kolkata", "Hyderabad"].map((cityName) => (
                                        <button
                                            key={cityName}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCity(cityName);
                                                const cityWards = Object.keys(WARDS_DATA).filter((w) => WARDS_DATA[w].city.toLowerCase() === cityName.toLowerCase());
                                                const firstWard = cityWards[0] || Object.keys(WARDS_DATA)[0];
                                                setWard(firstWard);
                                                setSelectedSector(null);
                                                loadWardForecast(firstWard, cityName);
                                            }}
                                            className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                                                selectedCity.toLowerCase() === cityName.toLowerCase()
                                                    ? "bg-blue-600 text-white font-bold shadow-xs"
                                                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70"
                                            }`}
                                        >
                                            <span className="truncate">{cityName}</span>
                                            {selectedCity.toLowerCase() === cityName.toLowerCase() && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Active Ward Selector Select Box */}
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                                        Active Ward ({selectedCity})
                                    </label>
                                    <select
                                        value={ward}
                                        onChange={(e) => {
                                            const newWard = e.target.value;
                                            setWard(newWard);
                                            setSelectedSector(null);
                                            loadWardForecast(newWard, selectedCity);
                                        }}
                                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                                    >
                                        {Object.entries(WARDS_DATA)
                                            .filter(([_, data]) => data.city.toLowerCase() === selectedCity.toLowerCase())
                                            .map(([wardKey, data]) => (
                                                <option key={wardKey} value={wardKey}>
                                                    {data.name} ({data.code})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            /* Collapsed Rail City Indicator */
                            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center border border-slate-200 cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                                    title={`Active City: ${selectedCity}`}
                                >
                                    {selectedCity.slice(0, 2).toUpperCase()}
                                </div>
                            </div>
                        )}

                        {/* Bottom User Profile */}
                        <div className="mt-auto pt-3 border-t border-slate-200/80">
                            {isSidebarExpanded ? (
                                <div className="animate-in fade-in duration-200">
                                    <div className="font-serif italic text-slate-800 text-[18px] leading-[1.12] font-normal tracking-tight mb-2 select-none">
                                        Safer Cities, Together.
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[#E0E7FF] text-[#4F46E5] font-bold text-xs flex items-center justify-center shadow-2xs">
                                                SS
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900 leading-tight">Shubham</div>
                                                <div className="text-[10px] text-slate-400">Municipal Commander</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <div className="w-8 h-8 rounded-full bg-[#E0E7FF] text-[#4F46E5] font-bold text-xs flex items-center justify-center shadow-2xs" title="Shubham Singh (Municipal Commander)">
                                        SS
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-100">
                    {/* TOP HEADER BAR (Elevated z-index for dropdown layering) */}
                    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-7 flex items-center justify-between relative z-[600] shrink-0">
                        <div className="flex items-center gap-3.5">
                            {/* Back Arrow Button to Overview Page */}
                            <button
                                type="button"
                                onClick={() => setView("overview")}
                                className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs hover:shadow-xs group shrink-0"
                                title="Back to City Matrix Overview"
                                aria-label="Back to City Matrix Overview"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            </button>

                                {/* Search Pill */}
                                <div className="relative w-96">
                                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                        <input
                                            ref={searchRef}
                                            type="text"
                                            placeholder="Search location, ward, or landmark..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setSearchOpen(true);
                                            }}
                                            onFocus={() => setSearchOpen(true)}
                                            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
                                        />
                                        <span className="text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs shrink-0">
                                            ⌘ K
                                        </span>
                                    </div>

                                    {/* Instant Autocomplete Results Dropdown */}
                                    {searchOpen && searchResults.length > 0 && (
                                        <div className="absolute top-12 left-0 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                            <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Matching Municipal Sectors
                                            </div>
                                            {searchResults.map((res, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleSelectSearchResult(res)}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50/70 flex items-center justify-between transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800">
                                                                {res.title}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {res.subtitle}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Status & Controls */}
                            <div className="flex items-center gap-2.5">

                                {/* City Selector Pill with Dropdown */}
                                <div className="relative" ref={cityDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCityDropdownOpen((prev) => !prev);
                                            setWardDropdownOpen(false);
                                        }}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-50/90 border border-blue-200/90 text-xs font-bold text-blue-900 hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
                                        title="Select Metropolitan City"
                                    >
                                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span>{selectedCity}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-blue-600 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {cityDropdownOpen && (
                                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-[700] animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                                Select Metropolitan City (6 Metros)
                                            </div>
                                            {["Chennai", "Mumbai", "Delhi", "Bengaluru", "Kolkata", "Hyderabad"].map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCity(c);
                                                        setCityDropdownOpen(false);
                                                        const cityWards = Object.keys(WARDS_DATA).filter((w) => WARDS_DATA[w].city.toLowerCase() === c.toLowerCase());
                                                        const nextWard = cityWards[0] || Object.keys(WARDS_DATA)[0];
                                                        setWard(nextWard);
                                                        setSelectedSector(null);
                                                        loadWardForecast(nextWard, c);
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                                        selectedCity.toLowerCase() === c.toLowerCase()
                                                            ? "text-blue-700 bg-blue-50 font-bold"
                                                            : "text-slate-700 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <span>{c}</span>
                                                    {selectedCity.toLowerCase() === c.toLowerCase() && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Ward Selector Pill with Dropdown */}
                                <div className="relative" ref={wardDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setWardDropdownOpen((prev) => !prev);
                                            setCityDropdownOpen(false);
                                        }}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                                        title="Select Municipal Ward in Active City"
                                    >
                                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span className="max-w-[140px] truncate">{ward}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${wardDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {wardDropdownOpen && (
                                        <div className="absolute right-0 sm:left-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-[700] animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                                {selectedCity} Municipal Wards
                                            </div>
                                            {Object.entries(WARDS_DATA)
                                                .filter(([_, data]) => data.city.toLowerCase() === selectedCity.toLowerCase())
                                                .map(([wardKey, data]) => (
                                                    <button
                                                        key={wardKey}
                                                        type="button"
                                                        onClick={() => {
                                                            setWard(wardKey);
                                                            setWardDropdownOpen(false);
                                                            setSelectedSector(null);
                                                            loadWardForecast(wardKey, selectedCity);
                                                        }}
                                                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                                            ward === wardKey
                                                                ? "text-blue-700 bg-blue-50 font-bold"
                                                                : "text-slate-700 hover:bg-slate-50 font-medium"
                                                        }`}
                                                    >
                                                        <div className="truncate pr-2">
                                                            <div className="font-semibold text-xs text-slate-800">{data.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono truncate">{data.riverName}</div>
                                                        </div>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${data.riskColor || 'text-slate-500 bg-slate-100'}`}>
                                                            {data.riskLevel.replace(" RISK", "")}
                                                        </span>
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>

                                {/* Live Data Badge */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold shadow-2xs" title="Open-Meteo & IMD Live Radar Synchronized">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Live Telemetry</span>
                                </div>

                                {/* Real-Time Date and Time Clock */}
                                <div className="text-xs font-medium text-slate-500 flex items-center bg-slate-50/90 px-3 py-1.5 rounded-full border border-slate-200/80 shadow-2xs">
                                    <Clock className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                                    <span className="text-slate-600 font-medium">
                                        {currentTime.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="ml-2 font-bold font-mono text-slate-800">
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>

                                {/* Notification Bell */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        pushToast(
                                            "Mithi River Alert: Water level at Kurla Lowland sensor 3.42m approaching danger threshold."
                                        )
                                    }
                                    className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                    title="Alerts Feed"
                                >
                                    <Bell className="w-4 h-4" />
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                                </button>
                            </div>
                        </header>

                        {/* CENTER FULL-BLEED LEAFLET MAP CANVAS */}
                        <div className="relative flex-1 w-full h-full overflow-hidden">
                            <InteractiveVectorMap
                                ward={ward}
                                wardData={currentWardData}
                                sectorDepths={sectorDepths}
                                selectedSector={selectedSector}
                                onSelectSector={setSelectedSector}
                                layers={layers}
                                mapStyle={mapStyle}
                                mapToggles={mapToggles}
                                timelineStep={timeStep}
                            />

                            {/* FLOATING BASEMAP SWITCHER (Top Center) */}
                            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[400] flex items-center p-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl gap-1">
                                {["Map", "Satellite", "Terrain"].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setMapStyle(type)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                            mapStyle === type
                                                ? "bg-[#1E293B] text-white shadow-sm"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {/* FLOATING ZOOM & LOCATE CONTROLS (Top Right) */}
                            <div className="absolute top-20 right-6 z-[400] flex flex-col gap-2">
                                <div className="flex flex-col rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => window._rainDropMap && window._rainDropMap.zoomIn()}
                                        className="p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors border-b border-slate-100 cursor-pointer"
                                        title="Zoom In"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window._rainDropMap && window._rainDropMap.zoomOut()}
                                        className="p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                                        title="Zoom Out"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window._rainDropMap) {
                                            window._rainDropMap.flyTo([19.0728, 72.8797], 14, { duration: 1.2 });
                                        }
                                    }}
                                    className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                                    title="Center Map"
                                >
                                    <Crosshair className="w-4 h-4" />
                                </button>
                            </div>

                            {/* SCALE BAR & NORTH ARROW (Bottom Right) */}
                            <div className="absolute bottom-24 right-8 z-[400] flex items-center gap-3 pointer-events-none select-none">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs text-[10.5px] font-mono text-slate-600">
                                    <span>0</span>
                                    <span className="w-12 h-0.5 bg-slate-400 inline-block" />
                                    <span>5 km</span>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center justify-center text-[10px] font-extrabold text-slate-700">
                                    N ▲
                                </div>
                            </div>

                            {/* FLOATING LEFT CARD: COMPACT EMERGENCY CORRIDOR BADGE */}
                            <div className={`absolute top-5 left-6 z-[400] bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl transition-all duration-300 ${
                                riverCardMinimized ? "w-auto p-2.5" : "w-[310px] p-4 flex flex-col gap-2.5"
                            }`}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 ${
                                        currentWardData.riskLevel.includes("HIGH") || currentWardData.riskLevel.includes("EXTREME")
                                            ? "bg-rose-50 border border-rose-200/80 text-rose-600"
                                            : "bg-amber-50 border border-amber-200/80 text-amber-700"
                                    }`}>
                                        <span>⚠️</span> Emergency Watch
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                                            {currentWardData.city}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setRiverCardMinimized(!riverCardMinimized)}
                                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                            title={riverCardMinimized ? "Expand Corridor Watch" : "Collapse to Pill"}
                                        >
                                            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${riverCardMinimized ? "rotate-180" : ""}`} />
                                        </button>
                                    </div>
                                </div>

                                {!riverCardMinimized && (
                                    <>
                                        <div>
                                            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug">
                                                {currentWardData.riverName} Basin
                                            </h3>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs font-medium text-slate-600">
                                                    Stage:{" "}
                                                    <span className="text-rose-600 font-bold font-mono">
                                                        {liveForecast?.river_level_m ? `${liveForecast.river_level_m}m` : `${currentWardData.riverLevel}m`}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 ml-1">(Danger: {currentWardData.dangerLevel}m)</span>
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window._rainDropMap && currentWardData.sectors?.[0]) {
                                                            const c = currentWardData.sectors[0].coords.split(',').map(n => parseFloat(n.trim()));
                                                            if (c.length >= 2) window._rainDropMap.flyTo([c[0], c[1]], 15, { duration: 1.2 });
                                                        }
                                                    }}
                                                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
                                                    title="Center on Basin"
                                                >
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                            <span>⚡ {currentWardData.activePumps} pumps active</span>
                                            <span className="text-rose-600 font-semibold">{currentWardData.sectors.filter((_, i) => (sectorDepths[i] || 0) >= 30).length} flooded spots</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* FLOATING RIGHT CARD: "Flood Inundation (Live)" */}
                            <div
                                className={`absolute top-5 right-6 z-[400] w-[295px] bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl p-5 flex flex-col gap-3.5 transition-all duration-300 ${
                                    rightCardCollapsed ? "h-14 overflow-hidden" : ""
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-xs">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xs font-bold text-slate-900">
                                                    Flood Inundation
                                                </h3>
                                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Live
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRightCardCollapsed(!rightCardCollapsed)}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                                        title={rightCardCollapsed ? "Expand Layer Deck" : "Collapse Layer Deck"}
                                    >
                                        <ChevronUp
                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                rightCardCollapsed ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                </div>

                                {!rightCardCollapsed && (
                                    <>
                                        {/* Severity Legend */}
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                Depth Classification
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5 bg-slate-50/80 p-2 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/80 border border-rose-100 shadow-2xs">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 ring-2 ring-rose-200" />
                                                    <div className="leading-tight">
                                                        <div className="text-[10.5px] font-bold text-slate-800">&gt; 30 cm</div>
                                                        <div className="text-[9px] font-semibold text-rose-600">Critical</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/80 border border-blue-100 shadow-2xs">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 ring-2 ring-blue-200" />
                                                    <div className="leading-tight">
                                                        <div className="text-[10.5px] font-bold text-slate-800">15–30 cm</div>
                                                        <div className="text-[9px] font-semibold text-blue-600">Caution</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/80 border border-sky-100 shadow-2xs">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0 ring-2 ring-sky-200" />
                                                    <div className="leading-tight">
                                                        <div className="text-[10.5px] font-bold text-slate-800">&lt; 15 cm</div>
                                                        <div className="text-[9px] font-semibold text-sky-600">Possible</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/80 border border-emerald-100 shadow-2xs">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-200" />
                                                    <div className="leading-tight">
                                                        <div className="text-[10.5px] font-bold text-slate-800">0 cm Dry</div>
                                                        <div className="text-[9px] font-semibold text-emerald-600">Passable</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Toggle Switches */}
                                        <div>
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                <span>GIS Layer Overlays</span>
                                                <span className="text-[9px] font-normal text-slate-400">Active telemetry</span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {[
                                                    { id: "hotspots", label: "Critical Hotspots", desc: "6 inundation zones", activeColor: "bg-rose-500", dot: "bg-rose-500" },
                                                    { id: "pumps", label: "Drainage Pumps", desc: "12 active stations", activeColor: "bg-blue-600", dot: "bg-blue-600" },
                                                    { id: "shelters", label: "Relief Shelters", desc: "4 emergency hubs", activeColor: "bg-indigo-600", dot: "bg-indigo-600" },
                                                    { id: "metro", label: "Metro & Transport", desc: "Subway & rail gates", activeColor: "bg-emerald-500", dot: "bg-emerald-500" },
                                                    { id: "boundaries", label: "Ward Boundaries", desc: "BMC L-Ward zone", activeColor: "bg-slate-700", dot: "bg-slate-600" },
                                                ].map((toggle) => (
                                                    <div key={toggle.id} className="flex items-center justify-between py-1 px-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${toggle.dot}`} />
                                                            <div>
                                                                <span className="text-xs font-semibold text-slate-800 block leading-tight">
                                                                    {toggle.label}
                                                                </span>
                                                                <span className="text-[9.5px] text-slate-400 block">
                                                                    {toggle.desc}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setMapToggles((prev) => ({
                                                                    ...prev,
                                                                    [toggle.id]: !prev[toggle.id],
                                                                }))
                                                            }
                                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                mapToggles[toggle.id] ? toggle.activeColor : "bg-slate-200"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                                    mapToggles[toggle.id]
                                                                        ? "translate-x-4"
                                                                        : "translate-x-0"
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Telemetry Status Line */}
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                {currentWardData.name} Basin
                                            </span>
                                            <span className="text-slate-600 font-semibold">{currentWardData.sectors.length} Nodes Active</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* FLOATING BOTTOM BAR: "Simulation Timeline" */}
                            <div className="absolute bottom-6 left-6 right-6 z-[400] bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl px-6 py-3 flex items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Left Title */}
                                <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="w-8 h-8 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-800">Simulation Timeline</div>
                                        <div className="text-[10px] text-slate-400">Inundation model progression</div>
                                    </div>
                                </div>

                                {/* Center Play & Scrubber */}
                                <div className="flex-1 max-w-xl flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="w-8 h-8 rounded-full bg-[#1E293B] text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm cursor-pointer shrink-0"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-3.5 h-3.5 fill-current" />
                                        ) : (
                                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                        )}
                                    </button>

                                    <div className="flex-1 relative flex items-center">
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 transition-all duration-300"
                                                style={{ width: `${(timelineIndex / 4) * 100}%` }}
                                            />
                                        </div>
                                        {/* Step Markers */}
                                        <div className="absolute inset-x-0 flex justify-between items-center px-1 pointer-events-none">
                                            {["Now", "+1h", "+3h", "+6h", "+12h"].map((step, idx) => (
                                                <button
                                                    key={step}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTimelineIndex(idx);
                                                        setTimeStep(idx);
                                                        pushToast(`Timeline updated to ${step}`);
                                                    }}
                                                    className="pointer-events-auto flex flex-col items-center cursor-pointer group"
                                                >
                                                    <div
                                                        className={`w-3 h-3 rounded-full border-2 transition-all ${
                                                            timelineIndex === idx
                                                                ? "bg-blue-600 border-white ring-2 ring-blue-600 scale-125"
                                                                : "bg-white border-slate-300 group-hover:border-slate-400"
                                                        }`}
                                                    />
                                                    <span
                                                        className={`text-[10px] mt-1.5 font-bold ${
                                                            timelineIndex === idx
                                                                ? "text-blue-600 font-extrabold"
                                                                : "text-slate-400"
                                                        }`}
                                                    >
                                                        {step}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Live Telemetry Refresh & Run Simulation Button */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            loadWardForecast(ward, selectedCity);
                                            pushToast(`Live radar & telemetry refreshed at ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
                                        }}
                                        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-blue-50/90 hover:bg-blue-100/90 border border-blue-200/90 text-xs font-semibold text-blue-700 transition-all cursor-pointer shadow-2xs"
                                        title="Click to fetch latest Open-Meteo Doppler observation and recompute ML depths"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isFetchingForecast ? "animate-spin" : ""}`} />
                                        <span>Live Feed · {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSimulationModalOpen(true)}
                                        className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#0F2942] hover:bg-[#163A5E] text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer"
                                    >
                                        <span>Run Flood Simulation</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
</div>
</div>
</div>
</div>
);
}

// ============================================================================
// Public Hero Landing Page (Exact Editorial GIS Dark Theme with Rich Photography)
// ============================================================================


