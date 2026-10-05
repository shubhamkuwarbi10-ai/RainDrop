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

    // Feed health, derived from fetch outcomes. See lib/riskScale.js.
    const [feed, setFeed] = useState({
        lastSuccessAt: null,
        lastErrorAt: null,
        error: null,
        serverStatus: null,
        observedAt: null,
    });

    // Operator session. Null means a citizen is using the page.
    const { operator, setOperator, signOut: signOutOperator } = useOperatorSession();
    const [loginOpen, setLoginOpen] = useState(false);
    const [confirmRequest, setConfirmRequest] = useState(null);

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

    // Toasts are for operational outcomes and errors only. Routine UI changes
    // (focus, map view, timeline position) are visible on screen already, and
    // announcing them trained operators to ignore the toast area entirely.
    // `tone` drives the aria-live politeness: errors assert, the rest is polite.
    const pushToast = (msg, tone = "info") => {
        const id = ++toastId.current;
        setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
        // Errors stay long enough to read and act on; the old 2.2 s was not
        // enough time to read "backend offline" before it vanished.
        const lifetime = tone === "error" ? 9000 : 4500;
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), lifetime);
    };

    // Fetch the ward forecast. Feed health is derived from what actually
    // happened to this request, never from the wall clock.
    const loadWardForecast = useCallback(async (targetWard = ward, targetCity = selectedCity) => {
        setIsFetchingForecast(true);
        try {
            const res = await fetch(
                `/api/ward_forecast?ward_name=${encodeURIComponent(targetWard)}&city=${encodeURIComponent(targetCity)}`,
                { credentials: "same-origin" }
            );
            if (!res.ok) throw new Error(`Server responded ${res.status}`);

            const data = await res.json();
            setLiveForecast(data);
            setFeed({
                lastSuccessAt: Date.now(),
                lastErrorAt: null,
                error: null,
                serverStatus: (data.provenance && data.provenance.data_status) || "heuristic",
                observedAt: (data.provenance && data.provenance.observed_at) || null,
            });

            const forecast = data.forecast;
            if (forecast && forecast.hourly_rainfall_mm && forecast.hourly_rainfall_mm.length > 0) {
                setHydrograph(forecast.hourly_rainfall_mm.slice(0, 7).map((val, idx) => ({
                    t: forecast.hourly_labels[idx] || `+${idx}h`,
                    rain: Math.round(val * 10) / 10,
                    label: forecast.hourly_labels[idx] || `+${idx}h`,
                })));
            }
        } catch (err) {
            // Previously this only reached console.warn, so the UI kept showing
            // mock numbers under a green "Live" badge.
            setFeed((prev) => ({ ...prev, lastErrorAt: Date.now(), error: err.message }));
        } finally {
            setIsFetchingForecast(false);
        }
    }, [ward, selectedCity]);

    useEffect(() => {
        loadWardForecast(ward, selectedCity);
        const pollId = setInterval(() => loadWardForecast(ward, selectedCity), 30000);
        return () => clearInterval(pollId);
    }, [ward, selectedCity, loadWardForecast]);

    // City registry: supplies each city's reference evacuation corridor so the
    // map and the route panel stop showing Mumbai's flyover everywhere.
    const [cityRegistry, setCityRegistry] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/cities", { credentials: "same-origin" })
            .then((response) => (response.ok ? response.json() : null))
            .then((body) => {
                if (!cancelled && body) setCityRegistry(body);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const cityCorridor = useMemo(() => {
        if (!cityRegistry) return null;
        const match = cityRegistry.cities.find(
            (city) => city.name.toLowerCase() === String(selectedCity).toLowerCase()
        );
        return match ? match.corridor : null;
    }, [cityRegistry, selectedCity]);

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
                    return 100;
                }
                return p + 5;
            });
        }, 150);
        return () => clearInterval(interval);
    }, [isSimulatingRoute]);

    // Feed state drives the status badge and the offline banner.
    const feedStatus = useMemo(() => feedState(feed), [feed]);
    const feedMeta = useMemo(() => statusMeta(feedStatus), [feedStatus]);
    const isFeedTrustworthy = feedStatus === "live" || feedStatus === "heuristic";

    const currentWardData = useMemo(() => {
        const base = WARDS_DATA[ward] || WARDS_DATA["Velachery"] || Object.values(WARDS_DATA)[0];
        // Only overlay live values when the response is for the ward on screen
        // and the feed is actually current. Otherwise the sample data stands,
        // and the status badge says so.
        if (!liveForecast || !liveForecast.ward || liveForecast.ward.name !== base.name || !isFeedTrustworthy) {
            return base;
        }
        const river = liveForecast.river || {};
        const forecast = liveForecast.forecast || {};
        const pumps = liveForecast.pumps || {};
        return {
            ...base,
            riverLevel: river.estimated_level_m !== undefined ? river.estimated_level_m : base.riverLevel,
            dangerLevel: river.danger_level_m !== undefined ? river.danger_level_m : base.dangerLevel,
            rainfallForecast: forecast.total_rainfall_mm !== undefined ? `${forecast.total_rainfall_mm} mm` : base.rainfallForecast,
            // There is no pump telemetry feed. Say so rather than inventing a count.
            activePumps: pumps.active === null || pumps.active === undefined
                ? `— / ${pumps.total_installed ?? "?"} (no telemetry)`
                : `${pumps.active} / ${pumps.total_installed}`,
            riskLevel: forecast.risk_level || base.riskLevel,
        };
    }, [ward, liveForecast, isFeedTrustworthy]);

    const sectorDepths = useMemo(() => {
        const forecast = (isFeedTrustworthy && liveForecast && liveForecast.forecast) || null;
        const predDepth = forecast ? forecast.predicted_flood_depth_cm : null;
        const livePeak = (forecast && forecast.peak_intensity_mm_hr) || 15;
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
    }, [currentWardData, timeStep, scenario, liveForecast, isFeedTrustworthy]);

    // Sector depths are modelled from the ward estimate and sample elevations.
    // They are never a measurement, and the UI labels them accordingly.
    const sectorDepthsAreModelled = true;

    const floodStats = useMemo(() => {
        // Band boundaries come from the shared risk scale so the counts here
        // and the colours on the map can never disagree.
        const counts = { clear: 0, caution: 0, critical: 0 };
        sectorDepths.forEach((depth) => {
            const band = bandForDepth(depth);
            if (band.order <= 1) counts.clear += 1;
            else if (band.order === 2) counts.caution += 1;
            else counts.critical += 1;
        });
        return counts;
    }, [sectorDepths]);

    /**
     * Ask for confirmation, then run a control-room action.
     *
     * The old runAction waited 900 ms and then reported success without doing
     * anything. This one requires a signed-in operator, shows what is about to
     * happen, and reports the real outcome of the request.
     */
    const requestOperatorAction = ({ title, description, details, confirmLabel, run }) => {
        if (!operator) {
            setLoginOpen(true);
            pushToast("Sign in as an operator to dispatch resources.", "error");
            return;
        }
        setConfirmRequest({
            title,
            description,
            details,
            confirmLabel,
            run,
        });
    };

    const confirmPendingAction = async () => {
        const request = confirmRequest;
        setConfirmRequest(null);
        if (!request) return;
        try {
            const outcome = await request.run();
            pushToast(outcome || `${request.title} requested.`, "success");
        } catch (err) {
            pushToast(`${request.title} failed: ${err.message}`, "error");
        }
    };

    /**
     * Open the map for a city, always with one of that city's own wards.
     *
     * This used to set the city and keep whatever ward was current, so choosing
     * Mumbai from the landing page opened Chennai's Velachery ward under a
     * "Mumbai" label, and the live forecast never matched the ward on screen.
     */
    const openCityMap = (targetWard, targetCity) => {
        const cityName = targetCity || selectedCity;
        const belongsToCity = (wardKey) =>
            WARDS_DATA[wardKey] && WARDS_DATA[wardKey].city.toLowerCase() === String(cityName).toLowerCase();
        const nextWard = targetWard && belongsToCity(targetWard)
            ? targetWard
            : Object.keys(WARDS_DATA).find(belongsToCity) || ward;

        setSelectedCity(cityName);
        setWard(nextWard);
        setSelectedSector(null);
        setIsMapEnabled(true);
        setView("command");
        // No explicit fetch: the effect watching [ward, selectedCity] loads it.
    };

    const handleEnableMap = () => setIsMapEnabled(true);
    const handleDisableMap = () => setIsMapEnabled(false);

    // --- Pipeline run (operator only; the endpoint now actually runs it) ---
    const handleRefreshNowcast = () => {
        requestOperatorAction({
            title: "Run the nowcast pipeline",
            description: `This recomputes the rainfall nowcast for ${selectedCity}. It can take several minutes and will replace the current forecast raster.`,
            details: [
                { label: "City", value: selectedCity },
                { label: "Stage", value: "nowcast" },
                { label: "Signed in as", value: operator ? operator.display_name : "—" },
            ],
            confirmLabel: "Run pipeline",
            run: async () => {
                setNowcastBusy(true);
                setNowcastResult(null);
                try {
                    const params = new URLSearchParams({ stage: "nowcast", city: selectedCity.toLowerCase() });
                    const res = await fetch(`/api/run_pipeline?${params}`, {
                        method: "POST",
                        credentials: "same-origin",
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data.detail || `Server responded ${res.status}`);
                    setNowcastResult(data);
                    return data.succeeded
                        ? `Nowcast pipeline finished in ${data.duration_seconds}s.`
                        : `Nowcast pipeline exited with code ${data.exit_code}.`;
                } finally {
                    setNowcastBusy(false);
                }
            },
        });
    };

    // --- Route guidance (public; returns a reference corridor, not a route) ---
    const handleRouteCheck = async (e) => {
        e.preventDefault();
        if (!routeOrigin.trim() || !routeDest.trim()) return;
        setRouteCheckBusy(true);
        setRouteCheckResult(null);
        try {
            const params = new URLSearchParams({
                origin: routeOrigin,
                destination: routeDest,
                city: selectedCity.toLowerCase(),
                depth_cm: routeDepth,
            });
            const res = await fetch(`/api/route_check?${params}`, { credentials: "same-origin" });
            if (!res.ok) throw new Error(`Server responded ${res.status}`);
            setRouteCheckResult(await res.json());
        } catch (err) {
            setRouteCheckResult({ error: err.message });
            pushToast(`Could not check that route: ${err.message}`, "error");
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

    /*
      Chrome rendered in every view: toasts, the sign-in and confirmation
      dialogs, and a persistent banner when the data on screen is not current.
      The banner is deliberately not dismissible while the condition holds - an
      operator must not be able to hide the fact that the feed is down.
    */
    const globalChrome = (
        <>
            <ToastStack toasts={toasts} />
            {!isFeedTrustworthy && (
                /*
                  In normal flow, not fixed. Each view root is a flex column, so
                  the banner takes its own row and pushes the toolbar down
                  instead of covering the city selector and the retry control.
                */
                <div
                    role="alert"
                    className={`relative w-full shrink-0 z-[1000] px-4 py-2.5 text-center text-sm font-semibold border-b ${feedMeta.chip}`}
                >
                    <span className="font-bold">{feedMeta.label}:</span>{" "}
                    {feedMeta.plain}{" "}
                    {feed.lastSuccessAt
                        ? `Last successful update ${ageLabel(feed.lastSuccessAt)}.`
                        : "No data has been received in this session."}{" "}
                    <button
                        type="button"
                        onClick={() => loadWardForecast(ward, selectedCity)}
                        className="underline underline-offset-2 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                    >
                        Retry now
                    </button>
                </div>
            )}
            <OperatorLoginDialog
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onSignedIn={setOperator}
            />
            <ConfirmDialog
                request={confirmRequest}
                onCancel={() => setConfirmRequest(null)}
                onConfirm={confirmPendingAction}
            />
        </>
    );

    // VIEW 1: Public Hero Landing Page (Editorial Light Sea Blue GIS Theme)
    if (view === "hero") {
        return (
            <div className="min-h-screen w-full bg-white text-slate-900 selection:bg-emerald-600 selection:text-white font-sans antialiased overflow-x-hidden">
                {globalChrome}
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
                        setView("overview");
                    }}
                    onOpenMap={(targetWard, targetCity) => openCityMap(targetWard, targetCity)}
                    onCheckRoute={(targetCity) => {
                        openCityMap(null, targetCity);
                        setRouteCheckResult(null);
                        setRouteCheckOpen(true);
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
                {globalChrome}
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
                    onOpenMap={(targetWard, targetCity) => openCityMap(targetWard, targetCity)}
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
            {globalChrome}

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
                                    Can I get through?
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-900 font-bold uppercase border border-violet-300">
                                        Demo
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-600">
                                    Shows the elevated road on file for this city and what a given water depth
                                    means for walking, riding and driving.
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
                                <label htmlFor="route-origin" className="block text-xs font-bold text-slate-700 mb-1">Starting from</label>
                                <input
                                    id="route-origin"
                                    value={routeOrigin}
                                    onChange={(e) => setRouteOrigin(e.target.value)}
                                    placeholder="Your area or landmark"
                                    required
                                    className="w-full min-h-[44px] rounded-2xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder-slate-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700"
                                />
                            </div>
                            <div>
                                <label htmlFor="route-destination" className="block text-xs font-bold text-slate-700 mb-1">Going to</label>
                                <input
                                    id="route-destination"
                                    value={routeDest}
                                    onChange={(e) => setRouteDest(e.target.value)}
                                    placeholder="Destination area or landmark"
                                    required
                                    className="w-full min-h-[44px] rounded-2xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder-slate-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="route-depth" className="block text-xs font-bold text-slate-700 mb-1">
                                    Water depth on the road (cm)
                                </label>
                                <input
                                    id="route-depth"
                                    type="number"
                                    min="0"
                                    max="200"
                                    step="1"
                                    value={routeDepth}
                                    onChange={(e) => setRouteDepth(Number(e.target.value))}
                                    aria-describedby="route-depth-help"
                                    className="w-full min-h-[44px] rounded-2xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700"
                                />
                                <p id="route-depth-help" className="mt-1 text-xs text-slate-600">
                                    What you can see, or the estimate shown for your ward.
                                </p>
                            </div>
                            <div className="sm:col-span-2 mt-1">
                                <button
                                    type="submit"
                                    disabled={routeCheckBusy}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {routeCheckBusy ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Checking…
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" aria-hidden="true" /> Check this route
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {routeCheckResult && !routeCheckResult.error && (
                            <div className="space-y-3 border-t border-slate-200 pt-4">
                                {/*
                                  Honest version of the old "dual corridor" panel.
                                  The distances, travel times and per-route flood
                                  depths it used to show were generated constants,
                                  and the recommended corridor was the same Mumbai
                                  flyover in every city.
                                */}
                                <div className="rounded-2xl border border-violet-300 bg-violet-50 p-3 text-xs text-violet-900">
                                    <strong>Reference information, not a route.</strong> This shows the elevated
                                    road on file for {routeCheckResult.city} and what the reported depth means for
                                    each way of travelling. No live road, traffic or closure data is used.
                                </div>

                                <div className="rounded-2xl border border-slate-300 bg-white p-3.5">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        {routeCheckResult.suggested_corridor?.name}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                                        {routeCheckResult.suggested_corridor?.summary}
                                    </p>
                                    {routeCheckResult.suggested_corridor?.waypoints?.length > 0 && (
                                        <ol className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-700">
                                            {routeCheckResult.suggested_corridor.waypoints.map((point, idx) => (
                                                <li key={point} className="flex items-center gap-1.5">
                                                    {idx > 0 && <span className="text-slate-400" aria-hidden="true">&rarr;</span>}
                                                    <span className="font-medium">{point}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-slate-300 overflow-hidden">
                                    <table className="w-full text-xs">
                                        <caption className="sr-only">
                                            Can I pass through water {routeCheckResult.reported_depth_cm} cm deep?
                                        </caption>
                                        <thead className="bg-slate-100 text-slate-800">
                                            <tr>
                                                <th scope="col" className="text-left px-3 py-2 font-bold">How you travel</th>
                                                <th scope="col" className="text-left px-3 py-2 font-bold">
                                                    At {routeCheckResult.reported_depth_cm} cm
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(routeCheckResult.passability || []).map((row) => {
                                                const tone = row.verdict === "passable"
                                                    ? "text-slate-800 bg-white"
                                                    : row.verdict === "risky"
                                                        ? "text-orange-900 bg-orange-50"
                                                        : "text-red-50 bg-red-800";
                                                return (
                                                    <tr key={row.mode} className={`border-t border-slate-200 ${tone}`}>
                                                        <th scope="row" className="text-left px-3 py-2.5 font-semibold">{row.mode}</th>
                                                        <td className="px-3 py-2.5">{row.advice}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-5">
                                    {(routeCheckResult.provenance?.caveats || []).map((caveat) => (
                                        <li key={caveat}>{caveat}</li>
                                    ))}
                                </ul>
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
                                    pushToast("Scenario applied to the map. These are modelled values, not observations.", "success");
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

                                {/*
                                  Feed status. Derived from whether data actually
                                  arrived, not from a ticking clock. The previous
                                  badge was permanently green and showed the wall
                                  clock, so stale and mock data looked live.
                                */}
                                <div
                                    role="status"
                                    aria-live="polite"
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${feedMeta.chip}`}
                                    title={feedMeta.plain}
                                >
                                    <span className={`w-2 h-2 rounded-full ${feedMeta.dot}`} aria-hidden="true" />
                                    <span>{feedMeta.label}</span>
                                    <span className="font-normal opacity-80">
                                        {feed.observedAt
                                            ? `· data ${clockLabel(feed.observedAt)}`
                                            : feed.lastSuccessAt
                                                ? `· ${ageLabel(feed.lastSuccessAt)}`
                                                : "· never updated"}
                                    </span>
                                </div>

                                {/* Operator session */}
                                <OperatorBadge
                                    operator={operator}
                                    onSignIn={() => setLoginOpen(true)}
                                    onSignOut={signOutOperator}
                                />

                                {/* Notification Bell */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const river = (liveForecast && liveForecast.river) || null;
                                        if (!river) {
                                            pushToast("No river level estimate is available right now.", "error");
                                            return;
                                        }
                                        pushToast(
                                            `${river.name}: estimated ${river.estimated_level_m} m against a ${river.danger_level_m} m danger level. Estimated from rainfall, not a gauge reading.`
                                        );
                                    }}
                                    className="relative p-2.5 min-h-[44px] min-w-[44px] rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                                    title="River level for the selected ward"
                                    aria-label="Show river level for the selected ward"
                                >
                                    <Bell className="w-4 h-4" aria-hidden="true" />
                                    {liveForecast && liveForecast.river && liveForecast.river.at_or_above_danger && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-700 ring-2 ring-white" aria-hidden="true" />
                                    )}
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
                                cityCorridor={cityCorridor}
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
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Flood estimate
                                                </h3>
                                                {/* Mirrors the real feed state rather than always reading "Live". */}
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${feedMeta.chip}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${feedMeta.dot}`} aria-hidden="true" />
                                                    {feedMeta.label}
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
                                        {/* Depth legend, from the one shared risk scale. */}
                                        <RiskLegend />

                                        {/* Toggle Switches */}
                                        <div>
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                <span>Map layers</span>
                                                <span className="text-xs font-normal text-slate-600">Show or hide</span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {[
                                                    { id: "hotspots", label: "Flood hotspots", desc: `${currentWardData.sectors.length} modelled sectors`, activeColor: "bg-slate-800", dot: "bg-slate-700" },
                                                    { id: "pumps", label: "Pump locations", desc: "Reference only, no telemetry", activeColor: "bg-slate-800", dot: "bg-slate-700" },
                                                    { id: "shelters", label: "Relief shelters", desc: "Reference only, confirm locally", activeColor: "bg-slate-800", dot: "bg-slate-700" },
                                                    { id: "metro", label: "Metro and transport", desc: "Reference locations", activeColor: "bg-slate-800", dot: "bg-slate-700" },
                                                    { id: "boundaries", label: "Ward boundary", desc: `${currentWardData.name}, ${selectedCity}`, activeColor: "bg-slate-800", dot: "bg-slate-700" },
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
                                        onClick={() => loadWardForecast(ward, selectedCity)}
                                        className="flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                                        title="Fetch the latest rainfall forecast and recompute depths"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isFetchingForecast ? "animate-spin" : ""}`} aria-hidden="true" />
                                        {/* The age of the data, not the current time. */}
                                        <span>
                                            {isFetchingForecast ? "Refreshing…" : `Data ${ageLabel(feed.lastSuccessAt)}`}
                                        </span>
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


