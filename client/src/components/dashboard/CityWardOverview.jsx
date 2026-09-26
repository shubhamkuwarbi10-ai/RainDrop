function CityWardOverview(props) {
    const {
        selectedCity,
        setSelectedCity,
        ward,
        setWard,
        currentTime,
        liveForecast,
        loadWardForecast,
        isFetchingForecast,
        onOpenMap,
        onOpenSitRep,
        onSwitchToHero,
        pushToast,
    } = props;

    const [riskFilter, setRiskFilter] = useState("ALL"); // 'ALL' | 'HIGH' | 'MODERATE' | 'LOW'

    const cityList = [
        { name: "Chennai", sub: "Adyar & Cooum" },
        { name: "Mumbai", sub: "Mithi River" },
        { name: "Delhi", sub: "Yamuna Floodplain" },
        { name: "Bengaluru", sub: "Vrishabhavathi" },
        { name: "Kolkata", sub: "Hooghly Basin" },
        { name: "Hyderabad", sub: "Musi River" },
    ];

    const activeCityProfile = (typeof CITY_PROFILES !== "undefined" && (CITY_PROFILES[selectedCity] || CITY_PROFILES["Chennai"])) || {};
    const activeBackdrop = (typeof CITY_HERO_BACKDROPS !== "undefined" && (CITY_HERO_BACKDROPS[selectedCity] || CITY_HERO_BACKDROPS["Chennai"])) || "";

    // Filter wards for selected city
    const cityWards = useMemo(() => {
        if (typeof WARDS_DATA === "undefined") return [];
        return Object.entries(WARDS_DATA).filter(([_, data]) => data && data.city && selectedCity && data.city.toLowerCase() === selectedCity.toLowerCase());
    }, [selectedCity]);

    // Filter by risk tier
    const filteredWards = useMemo(() => {
        if (riskFilter === "ALL") return cityWards;
        return cityWards.filter(([_, data]) => {
            const r = (data.riskLevel || "").toUpperCase();
            if (riskFilter === "HIGH") return r.includes("HIGH") || r.includes("CRITICAL");
            if (riskFilter === "MODERATE") return r.includes("MODERATE");
            if (riskFilter === "LOW") return r.includes("LOW");
            return true;
        });
    }, [cityWards, riskFilter]);

    // Summary calculations for the city top metrics strip
    const cityTotalRain = activeCityProfile.rainfall || "62 mm/h";
    const cityActivePumps = activeCityProfile.activePumps || "49 / 54";
    const cityWardsCount = cityWards.length || 6;
    const cityHighRiskCount = cityWards.filter(([_, d]) => (d.riskLevel || "").includes("HIGH") || (d.riskLevel || "").includes("CRITICAL")).length || 4;

    return (
        <div className="min-h-screen w-full bg-[#EAE7DF] text-stone-800 flex flex-col font-sans selection:bg-stone-800 selection:text-white antialiased overflow-hidden">
            {/* MAIN 3-PANEL VIEWPORT (Left Sidebar, Center Dashboard, Right Context Map) */}
            <div className="flex-1 flex flex-col lg:flex-row w-full h-screen overflow-hidden">
                
                {/* ========================================================================= */}
                {/* PANEL 1: LEFT SIDEBAR (Metropolitan Basins List)                          */}
                {/* ========================================================================= */}
                <aside className="w-full lg:w-[240px] bg-[#F7F5F0] border-r border-stone-300/70 flex flex-col h-full overflow-y-auto px-5 py-6 shrink-0 select-none">
                    {/* Brand Logo -> Click to Return Home */}
                    <button
                        type="button"
                        onClick={onSwitchToHero}
                        className="flex items-center gap-2.5 text-left group cursor-pointer mb-8"
                        title="Return to Welcome Landing Page"
                    >
                        <div className="w-7 h-7 flex items-center justify-center text-stone-900">
                            <Droplets className="w-6 h-6 fill-stone-900 text-stone-900" />
                        </div>
                        <span className="text-xl font-bold font-serif tracking-tight text-stone-900">
                            RainDrop
                        </span>
                    </button>

                    {/* Section Header */}
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold text-stone-900">
                            Metropolitan Basins
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                            Select a city to view analysis
                        </p>
                    </div>

                    {/* City List Items */}
                    <div className="space-y-1.5 flex-1">
                        {cityList.map((cityObj) => {
                            const isSelected = selectedCity.toLowerCase() === cityObj.name.toLowerCase();
                            return (
                                <div
                                    key={cityObj.name}
                                    onClick={() => {
                                        setSelectedCity(cityObj.name);
                                        const cityWardsList = Object.keys(WARDS_DATA).filter((w) => WARDS_DATA[w].city.toLowerCase() === cityObj.name.toLowerCase());
                                        const firstWard = cityWardsList[0] || Object.keys(WARDS_DATA)[0];
                                        setWard(firstWard);
                                        loadWardForecast(firstWard, cityObj.name);
                                        pushToast(`Active basin: ${cityObj.name}`);
                                    }}
                                    className={`p-3 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                                        isSelected
                                            ? "bg-[#EEF5F1] text-stone-900 border-l-[3px] border-[#2D7A58] shadow-2xs"
                                            : "hover:bg-stone-200/60 text-stone-700"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`p-1 rounded-lg shrink-0 ${isSelected ? "text-[#2D7A58]" : "text-stone-400"}`}>
                                            <CityMonumentIcon city={cityObj.name} className="w-5 h-5" />
                                        </div>
                                        <div className="truncate">
                                            <h3 className={`text-xs font-semibold leading-snug truncate ${isSelected ? "text-stone-900" : "text-stone-800"}`}>
                                                {cityObj.name}
                                            </h3>
                                            <span className="text-[11px] text-stone-500 block truncate">
                                                {cityObj.sub}
                                            </span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <ArrowRight className="w-4 h-4 text-[#2D7A58] shrink-0 mr-0.5" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* ========================================================================= */}
                {/* PANEL 2: CENTER MAIN DASHBOARD (Hero Card, KPIs, Ward Cards)              */}
                {/* ========================================================================= */}
                <main className="flex-1 bg-[#EAE7DF] flex flex-col h-full overflow-y-auto px-6 py-5 space-y-5">
                    {/* Top Navigation Bar Header */}
                    <div className="flex items-center justify-between gap-4 pb-2 border-b border-stone-300/70 shrink-0">
                        {/* Nav Links */}
                        <nav className="flex items-center gap-6 text-xs">
                            <button
                                type="button"
                                className="font-semibold text-stone-900 border-b-2 border-stone-900 pb-1 cursor-pointer"
                            >
                                Overview
                            </button>
                            <button
                                type="button"
                                onClick={() => onOpenMap(ward, selectedCity)}
                                className="text-stone-600 hover:text-stone-900 pb-1 transition-colors cursor-pointer"
                            >
                                Live Map
                            </button>
                            <button
                                type="button"
                                onClick={() => onOpenMap(ward, selectedCity)}
                                className="text-stone-600 hover:text-stone-900 pb-1 transition-colors cursor-pointer"
                            >
                                Data Layers
                            </button>
                            <button
                                type="button"
                                onClick={() => onOpenSitRep(ward)}
                                className="text-stone-600 hover:text-stone-900 pb-1 transition-colors cursor-pointer"
                            >
                                Insights
                            </button>
                        </nav>

                        {/* Right: Radar Live, Clock & Dedicated Home Button */}
                        <div className="flex items-center gap-4">
                            {/* Radar Live Status Pill */}
                            <div className="flex items-center gap-1.5 text-xs text-[#166534] font-medium font-mono">
                                <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
                                <span>Radar Live</span>
                            </div>

                            {/* Clock */}
                            <div className="hidden sm:flex items-center gap-1 text-xs text-stone-600 font-mono">
                                <Clock className="w-3.5 h-3.5 text-stone-500" />
                                <span>{(currentTime instanceof Date ? currentTime : new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>

                            {/* DEDICATED HOME BUTTON -> Leads directly to Landing Page */}
                            <button
                                type="button"
                                onClick={onSwitchToHero}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-all shadow-2xs cursor-pointer"
                                title="Return to Landing Page"
                            >
                                <Home className="w-3.5 h-3.5 text-white" />
                                <span>Home</span>
                            </button>
                        </div>
                    </div>

                    {/* HERO CITY BANNER CARD (Properly Fitted Image with Crystal-Clear Contrast) */}
                    <div className="rounded-2xl overflow-hidden relative shadow-md border border-stone-300/80 min-h-[200px] h-[200px] w-full flex items-center justify-between p-7 text-white select-none shrink-0">
                        {/* Background Backdrop Image with Exact Cover Fit */}
                        <img
                            src={activeBackdrop}
                            alt={`${selectedCity} Coastal Basin`}
                            className="absolute inset-0 w-full h-full object-cover object-center transform scale-100 filter brightness-90 contrast-105"
                        />
                        {/* Dark Gradient Vignette Overlay for High Readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/65 to-stone-950/35" />

                        {/* Left Banner Copy */}
                        <div className="relative z-10 max-w-xl">
                            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-300 font-medium block">
                                {selectedCity.toUpperCase()}
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-serif font-normal text-white mt-1 leading-tight tracking-tight">
                                {activeCityProfile.basin || `${selectedCity} River Basins`}
                            </h1>
                            <p className="text-xs text-stone-200/90 mt-2 font-light leading-relaxed max-w-md">
                                {activeCityProfile.description}
                            </p>
                        </div>

                        {/* Right Weather Overlay */}
                        <div className="relative z-10 hidden sm:flex items-center gap-3.5 pl-6 border-l border-white/20">
                            <CloudRain className="w-8 h-8 text-white stroke-[1.5]" />
                            <div className="text-left">
                                <span className="text-2xl font-bold font-mono text-white block tracking-tight">
                                    {cityTotalRain}
                                </span>
                                <span className="text-[11px] text-stone-300 font-light block">
                                    Current Rainfall
                                </span>
                                <span className="text-[10px] text-stone-400 font-light block">
                                    (IMD Doppler Radar)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 4 KPI METRIC TILES */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* KPI 1: Rainfall Rate */}
                        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-stone-50 text-stone-700">
                                    <CloudRain className="w-5 h-5 text-stone-700 stroke-[1.5]" />
                                </div>
                                <div>
                                    <span className="text-base font-bold font-mono text-stone-900 block leading-tight">
                                        {cityTotalRain}
                                    </span>
                                    <span className="text-[11px] text-stone-500 block mt-0.5">
                                        Rainfall Rate
                                    </span>
                                </div>
                            </div>
                            {/* Mini sparkline bar graphic */}
                            <div className="flex items-end gap-0.5 h-6 opacity-60">
                                <div className="w-1 bg-stone-300 h-2 rounded-t" />
                                <div className="w-1 bg-stone-300 h-3 rounded-t" />
                                <div className="w-1 bg-stone-400 h-4 rounded-t" />
                                <div className="w-1 bg-stone-500 h-5 rounded-t" />
                                <div className="w-1 bg-stone-700 h-6 rounded-t" />
                            </div>
                        </div>

                        {/* KPI 2: Drainage Pumps */}
                        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-stone-50 text-stone-700">
                                    <Activity className="w-5 h-5 text-stone-700 stroke-[1.5]" />
                                </div>
                                <div>
                                    <span className="text-base font-bold font-mono text-stone-900 block leading-tight">
                                        {cityActivePumps}
                                    </span>
                                    <span className="text-[11px] text-stone-500 block mt-0.5">
                                        Drainage Pumps
                                    </span>
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-[#166534] bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                                Active
                            </span>
                        </div>

                        {/* KPI 3: High Risk Zones */}
                        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-stone-50 text-stone-700">
                                    <Waves className="w-5 h-5 text-stone-700 stroke-[1.5]" />
                                </div>
                                <div>
                                    <span className="text-base font-bold font-mono text-stone-900 block leading-tight">
                                        {cityHighRiskCount} of {cityWardsCount}
                                    </span>
                                    <span className="text-[11px] text-stone-500 block mt-0.5">
                                        High Risk Zones
                                    </span>
                                </div>
                            </div>
                            {/* Mini wave stroke */}
                            <svg className="w-8 h-4 text-stone-400" viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M0 8 Q8 2, 16 8 T32 8" />
                            </svg>
                        </div>

                        {/* KPI 4: Terrain Resolution */}
                        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-stone-50 text-stone-700">
                                    <MapPin className="w-5 h-5 text-stone-700 stroke-[1.5]" />
                                </div>
                                <div>
                                    <span className="text-base font-bold font-mono text-stone-900 block leading-tight">
                                        30 m
                                    </span>
                                    <span className="text-[11px] text-stone-500 block mt-0.5">
                                        Terrain Resolution
                                    </span>
                                </div>
                            </div>
                            <span className="text-[10px] text-stone-500 font-mono">
                                CartoDEM (Sub-meter)
                            </span>
                        </div>
                    </div>

                    {/* WARD LEVEL RISK SECTION */}
                    <div className="space-y-4">
                        {/* Section Header with Risk Filter Tabs */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-serif font-normal text-stone-900">
                                    Ward Level Risk
                                </h2>
                                <p className="text-xs text-stone-500 mt-0.5">
                                    Projected flood depth across {selectedCity}'s {cityWardsCount} zones
                                </p>
                            </div>

                            {/* Pill Filters */}
                            <div className="flex items-center gap-1 bg-stone-300/50 p-1 rounded-full border border-stone-300/70 text-xs">
                                {["ALL", "HIGH", "MODERATE", "LOW"].map((flt) => {
                                    const label = flt === "ALL" ? "All Wards" : flt.charAt(0) + flt.slice(1).toLowerCase();
                                    const isFltActive = riskFilter === flt;
                                    return (
                                        <button
                                            key={flt}
                                            type="button"
                                            onClick={() => setRiskFilter(flt)}
                                            className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                                                isFltActive
                                                    ? "bg-white text-stone-900 shadow-2xs font-semibold"
                                                    : "text-stone-600 hover:text-stone-900"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3-Column Responsive Ward Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredWards.map(([wKey, data]) => {
                                const isCurrentWard = ward === wKey;
                                const maxDepth = data.sectors ? Math.max(...data.sectors.map(s => s.baseDepth || 0)) : 48;
                                const isCritical = maxDepth >= 40 || (data.riskLevel || "").includes("HIGH") || (data.riskLevel || "").includes("CRITICAL");
                                const isModerate = maxDepth >= 25 && maxDepth < 40;

                                return (
                                    <div
                                        key={wKey}
                                        onClick={() => {
                                            setWard(wKey);
                                            loadWardForecast(wKey, selectedCity);
                                        }}
                                        className={`bg-white rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md ${
                                            isCurrentWard
                                                ? "border-stone-800 ring-2 ring-stone-900/10"
                                                : "border-stone-200/90 hover:border-stone-400"
                                        }`}
                                    >
                                        {/* Top Row: Ward Name & Pill Badge */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-stone-900 leading-snug">
                                                    {data.name}
                                                </h3>
                                                <span className="text-xs text-stone-500 block mt-0.5">
                                                    {data.code} · {data.sectors?.length || 5} Sectors
                                                </span>
                                            </div>

                                            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0 border ${
                                                isCritical
                                                    ? "bg-[#FDF2E9] text-[#B95D1E] border-[#FCE3CF]"
                                                    : isModerate
                                                    ? "bg-[#FDF6ED] text-[#C07E38] border-[#FBECD9]"
                                                    : "bg-[#EEF7EE] text-[#3D7A46] border-[#DCF2DC]"
                                            }`}>
                                                {isCritical ? "High" : isModerate ? "Moderate" : "Low"}
                                            </span>
                                        </div>

                                        {/* Middle Gauge: Depth Metric & Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-stone-500 font-normal">Projected Flood Depth</span>
                                                <span className="font-bold font-mono text-sm text-stone-900">
                                                    ~{maxDepth} cm
                                                </span>
                                            </div>

                                            <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden border border-stone-200/50">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                        isCritical ? "bg-[#B95D1E]" : isModerate ? "bg-[#C07E38]" : "bg-[#3D7A46]"
                                                    }`}
                                                    style={{ width: `${Math.min(100, (maxDepth / 60) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Bottom Telemetry & Navigation Row */}
                                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
                                            {/* River Basin */}
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Waves className="w-4 h-4 text-stone-500 shrink-0 stroke-[1.5]" />
                                                <div className="truncate">
                                                    <span className="font-medium text-stone-800 truncate block text-[11px]">
                                                        {data.riverName}
                                                    </span>
                                                    <span className="text-[10px] text-stone-500 font-mono block">
                                                        {data.riverLevel}m / {data.dangerLevel}m
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Pumps & Shelters */}
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Home className="w-4 h-4 text-stone-500 shrink-0 stroke-[1.5]" />
                                                <div className="truncate">
                                                    <span className="font-medium text-stone-800 block text-[11px]">
                                                        Pumps &amp; Shelters
                                                    </span>
                                                    <span className="text-[10px] text-stone-500 block truncate">
                                                        {data.activePumps} Active
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right Circular Arrow Button -> Opens GIS Map for this ward */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setWard(wKey);
                                                    onOpenMap(wKey, selectedCity);
                                                }}
                                                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                                                title={`View ${data.name} on GIS Map`}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>

                {/* ========================================================================= */}
                {/* PANEL 3: RIGHT HIGH-CONTRAST WATERSHED TOPOGRAPHY RADAR (230px)           */}
                {/* ========================================================================= */}
                <aside className="w-full lg:w-[230px] bg-[#F7F5F0] border-l border-stone-300/70 hidden xl:flex flex-col justify-between p-5 shrink-0 select-none">
                    {/* Top Panel Header */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono uppercase font-semibold text-stone-500 tracking-wider">
                                BASIN WATERSHED GIS
                            </span>
                            <div className="w-5 h-5 rounded-full bg-emerald-50 text-[#15803D] flex items-center justify-center border border-emerald-200">
                                <Navigation className="w-3 h-3 rotate-45" />
                            </div>
                        </div>
                        <h3 className="text-sm font-semibold text-stone-900">
                            {selectedCity} Hydro-Grid
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                            Real-time 30m CartoDEM elevation
                        </p>
                    </div>

                    {/* High-Contrast Interactive Vector Terrain & River Matrix */}
                    <div className="my-4 bg-white rounded-xl border border-stone-300/80 p-3 shadow-2xs relative overflow-hidden flex flex-col items-center">
                        <svg className="w-full h-48" viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Background Terrain Elevation Contour Rings */}
                            <path d="M20 30 C50 15, 110 20, 140 45 C155 70, 130 110, 145 150 C155 175, 130 190, 90 195 C40 200, 15 170, 10 130 C5 80, 5 40, 20 30 Z" fill="#F4F8F5" stroke="#CBD5E1" strokeWidth="1" />
                            <path d="M35 50 C60 40, 100 45, 120 65 C135 85, 115 115, 125 140 C130 155, 110 170, 80 175 C45 180, 25 155, 20 120 C15 80, 20 55, 35 50 Z" fill="#E8F1EC" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                            
                            {/* Main River Arteries (High-Contrast Teal & Sky) */}
                            <path d="M10 70 Q50 85, 85 95 T150 100" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M25 130 Q60 135, 95 145 T145 155" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                            <path d="M85 95 Q90 120, 95 145" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3 2" />

                            {/* Active Sector Hotspot Pin Highlights */}
                            <circle cx="85" cy="95" r="4" fill="#E11D48" />
                            <circle cx="85" cy="95" r="8" stroke="#E11D48" strokeWidth="1" opacity="0.6" className="animate-ping" />
                            <circle cx="50" cy="85" r="3.5" fill="#D97706" />
                            <circle cx="120" cy="65" r="3" fill="#15803D" />
                            <circle cx="95" cy="145" r="3.5" fill="#E11D48" />

                            {/* Geographical Labels */}
                            <text x="14" y="24" fill="#64748B" fontSize="8" fontFamily="sans-serif" fontWeight="bold">Bay of Bengal Coast</text>
                            <text x="92" y="90" fill="#0F172A" fontSize="7" fontFamily="sans-serif" fontWeight="bold">Central (Adyar)</text>
                            <text x="55" y="142" fill="#0F172A" fontSize="7" fontFamily="sans-serif">Marshland</text>
                        </svg>

                        {/* Mini Legend Strip */}
                        <div className="w-full grid grid-cols-2 gap-1.5 pt-2 border-t border-stone-100 text-[10px] text-stone-500">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-0.5 bg-[#0284C7]" />
                                <span>River Basin</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-0.5 bg-[#059669]" />
                                <span>Surplus Canal</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Basin Metrics Summary & Launch Action */}
                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl border border-stone-300/70 text-xs">
                            <div className="flex items-center justify-between text-stone-500 text-[11px]">
                                <span>Monitored Sectors</span>
                                <span className="font-semibold text-stone-900">{cityWardsCount} Zones</span>
                            </div>
                            <div className="flex items-center justify-between text-stone-500 text-[11px] mt-1.5">
                                <span>Basin Elevation</span>
                                <span className="font-mono text-stone-900">{activeCityProfile.elevationAvg || "6.2m MSL"}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onOpenMap(ward, selectedCity)}
                            className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        >
                            <span>Open Full GIS Map</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </aside>

            </div>
        </div>
    );
}

// ============================================================================
// Main Application Component
// ============================================================================
