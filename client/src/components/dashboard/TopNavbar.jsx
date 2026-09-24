function TopNavbar(props) {
    const {
        selectedCity,
        setSelectedCity,
        ward,
        wardOpen,
        setWardOpen,
        setWard,
        setSelectedSector,
        soundEnabled,
        setSoundEnabled,
        isMapEnabled,
        onToggleMap,
        onSwitchToHero,
        pushToast,
        setIsMapEnabled,
    } = props;

    const CITIES = ["All Cities", "Chennai", "Mumbai", "Delhi", "Bengaluru", "Kolkata", "Hyderabad"];

    // Filter available wards based on selected city
    const filteredWards = useMemo(() => {
        if (!selectedCity || selectedCity === "All Cities") return Object.keys(WARDS_DATA);
        return Object.keys(WARDS_DATA).filter((w) => WARDS_DATA[w].city === selectedCity);
    }, [selectedCity]);

    return (
        <header className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    onClick={onSwitchToHero}
                    className="flex items-center gap-3 text-left group cursor-pointer"
                    title="Return to Welcome Screen"
                >
                    <div className="grid place-items-center w-10 h-10 rounded-xl bg-blue-600 border border-blue-700 text-white shadow-sm">
                        <Waves className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-extrabold text-blue-950 tracking-tight">RainDrop GIS</h1>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                PUBLIC SAFETY
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wide">
                            Urban Flood Intelligence &amp; Nowcasting Platform
                        </p>
                    </div>
                </button>

                {/* City Filter Pills */}
                <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 ml-2">
                    {CITIES.map((c) => (
                        <button
                            key={c}
                            onClick={() => {
                                setSelectedCity(c);
                                if (c !== "All Cities") {
                                    const first = Object.keys(WARDS_DATA).find((w) => WARDS_DATA[w].city === c);
                                    if (first) setWard(first);
                                }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selectedCity === c
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-600 hover:text-blue-600 hover:bg-white/60"
                            }`}
                        >
                            {c === "All Cities" ? "🌐 All Cities" : c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Dedicated Home Button leading to Landing Page */}
                <button
                    onClick={onSwitchToHero}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title="Return to Landing Page"
                >
                    <Home className="w-4 h-4 text-emerald-700" />
                    <span>Home</span>
                </button>

                {/* Enable / Standby Map Toggle Button */}
                <button
                    onClick={onToggleMap}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                        isMapEnabled
                            ? "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700"
                            : "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
                    }`}
                >
                    <Power className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isMapEnabled ? "🗺️ Map Active" : "🗺️ View Map"}</span>
                </button>

                {/* Ward Selector Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setWardOpen(!wardOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-sm"
                    >
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{ward}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${wardOpen ? "rotate-180" : ""}`} />
                    </button>

                    {wardOpen && (
                        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-2xl py-2 z-50 text-slate-900 max-h-80 overflow-y-auto">
                            <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                {selectedCity === "All Cities" ? "All Wards Across Cities" : `Wards in ${selectedCity}`}
                            </div>
                            {filteredWards.map((w) => (
                                <button
                                    key={w}
                                    onClick={() => {
                                        setWard(w);
                                        setSelectedCity(WARDS_DATA[w].city);
                                        setWardOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-blue-50 cursor-pointer ${
                                        w === ward ? "text-blue-900 font-extrabold bg-blue-50/70" : "text-slate-700"
                                    }`}
                                >
                                    <div>
                                        <span className="block font-semibold">{w}</span>
                                        <span className="text-[10px] text-slate-400">{WARDS_DATA[w].city} · {WARDS_DATA[w].code}</span>
                                    </div>
                                    {w === ward && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sound Alarm Toggle */}
                <button
                    onClick={() => {
                        setSoundEnabled(!soundEnabled);
                        pushToast(`Audio alert cues ${!soundEnabled ? "enabled" : "muted"}`);
                    }}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer shadow-sm ${
                        soundEnabled
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600"
                    }`}
                    title={soundEnabled ? "Audio Alarms Active" : "Audio Alarms Muted"}
                >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
            </div>
        </header>
    );
}

// ============================================================================
// Emergency Warning Banner
// ============================================================================
