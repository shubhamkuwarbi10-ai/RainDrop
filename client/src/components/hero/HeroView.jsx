function HeroView({ ward, wardData, onEnter, onSelectCity, onOpenMap, pushToast }) {
    const [activeRailStep, setActiveRailStep] = useState(0); // 0: DATA, 1: COVERAGE, 2: IMPACT, 3: FUTURE
    const [activePillarTab, setActivePillarTab] = useState(0);
    const [scenarioRain, setScenarioRain] = useState(45); // mm/hr
    const [scenarioTide, setScenarioTide] = useState(0.4); // meters
    const [scenarioPumps, setScenarioPumps] = useState(90); // %
    const [routeSimProgress, setRouteSimProgress] = useState(0);
    const [isSimulatingRoute, setIsSimulatingRoute] = useState(false);

    // CreativaX Studio State & Filmstrip Slideshow Track State
    const [slideIndex, setSlideIndex] = useState(4); // Starts at index 4 (Real 01 in middle set)
    const [activeArtworkIdx, setActiveArtworkIdx] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isCarouselHovered, setIsCarouselHovered] = useState(false);
    const [showreelModalOpen, setShowreelModalOpen] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [modalArtworkIdx, setModalArtworkIdx] = useState(0);

    // Responsive viewport tracking for mathematically exact slide centering
    const [viewportWidth, setViewportWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const ARTWORKS = [
        {
            num: "01",
            title: "Historic River City Ghats",
            subtitle: "Varanasi Riverfront Topography",
            desc: "High-resolution spatial elevation models mapping riverbank gradient steps and sacred hydrological corridors.",
            img: "/static/images/hero-river-ghats-aerial-hd.webp",
            tag: "RIVER TOPOGRAPHY",
            stats: "25.3176° N, 82.8739° E"
        },
        {
            num: "02",
            title: "Harbor Tides & Coastal Fleets",
            subtitle: "Mumbai Harbor Tidal Basin",
            desc: "Coastal surge modeling and astronomical high-tide boundary conditions for peninsular megacities.",
            img: "/static/images/hero-mumbai-harbor-boats.webp",
            tag: "COASTAL DYNAMICS",
            stats: "18.9220° N, 72.8347° E"
        },
        {
            num: "03",
            title: "Urban Monsoons & Street Reflections",
            subtitle: "Kolkata Metropolitan Grid",
            desc: "Street-level micro-inundation nowcasting tracking waterlogged taxi avenues and low-elevation sumps.",
            img: "/static/images/hero-kolkata-taxi-reflection.webp",
            tag: "URBAN INUNDATION",
            stats: "22.5726° N, 88.3639° E"
        },
        {
            num: "04",
            title: "Highway Drainage & Storm Surges",
            subtitle: "Corridor Transit Bypass",
            desc: "Dual-corridor safe elevation routing bypassing flooded underpasses and high-velocity stormwater splash zones.",
            img: "/static/images/hero-monsoon-bus-splash.webp",
            tag: "TRANSIT RESILIENCE",
            stats: "22.6200° N, 88.4200° E"
        }
    ];

    // 3 complete sets of ARTWORKS (indices 0..3, 4..7, 8..11) for true infinite forward/backward track sliding
    const EXTENDED_SLIDES = [
        ...ARTWORKS, // Set 0: buffer on the left
        ...ARTWORKS, // Set 1: active home set (starts at index 4)
        ...ARTWORKS  // Set 2: buffer on the right
    ];

    // Responsive card dimensions & exact horizontal center alignment:
    // Active card is prominent (48vw, max 760px); inactive cards are compact (23vw, max 360px)
    const cardWidthActive = Math.min(760, Math.max(340, Math.round(viewportWidth * 0.48)));
    const cardWidthInactive = Math.min(360, Math.max(200, Math.round(viewportWidth * 0.23)));
    const carouselGap = 20;

    // Center equation: (viewport / 2) - (activeCardWidth / 2) places the active card's center at exactly 50vw
    const centerOffset = Math.round(viewportWidth / 2 - (cardWidthActive / 2));
    const slideStep = cardWidthInactive + carouselGap;
    const translateX = centerOffset - (slideIndex * slideStep);

    // Automatic slide progression every 1.75 seconds with smooth 750ms glide
    useEffect(() => {
        if (isCarouselHovered) return;
        const timer = setInterval(() => {
            setIsTransitioning(true);
            setSlideIndex((prev) => {
                if (prev >= 8) return 5;
                return prev + 1;
            });
        }, 1750);
        return () => clearInterval(timer);
    }, [isCarouselHovered]);

    // Rock-solid infinite loop normalization:
    // When transitioning past index 7 to index 8 (Slide 01 in Set 2), wait for the 750ms transition
    // to complete, then silently reset to index 4 (Slide 01 in Set 1) with transition disabled.
    // Because Slide 8 and Slide 4 are visually identical on screen, this reset is 100% invisible!
    useEffect(() => {
        if (slideIndex >= 8) {
            const t = setTimeout(() => {
                setIsTransitioning(false);
                setSlideIndex(4);
            }, 750);
            return () => clearTimeout(t);
        } else if (slideIndex < 4) {
            const t = setTimeout(() => {
                setIsTransitioning(false);
                setSlideIndex((prev) => prev + 4);
            }, 750);
            return () => clearTimeout(t);
        }
    }, [slideIndex]);

    // Calculate active project index (0, 1, 2, 3) and sync activeArtworkIdx
    const activeProjectIdx = ((slideIndex % 4) + 4) % 4;

    useEffect(() => {
        setActiveArtworkIdx(activeProjectIdx);
    }, [activeProjectIdx]);

    const handleDotClick = (targetIdx) => {
        setIsTransitioning(true);
        setSlideIndex(4 + targetIdx);
    };



    // Dynamic calculation for the What-If sandbox
    const computedDepthCm = Math.max(0, Math.round((scenarioRain * 0.45) + (scenarioTide * 12) - ((scenarioPumps / 100) * 16)));
    const computedClearanceHours = Math.max(0.5, Number(((computedDepthCm * 0.12) / (scenarioPumps / 100)).toFixed(1)));

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleRunRouteSim = () => {
        setIsSimulatingRoute(true);
        setRouteSimProgress(0);
        const timer = setInterval(() => {
            setRouteSimProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setIsSimulatingRoute(false);
                    if (pushToast) pushToast("Dual-Corridor: Emergency vehicle successfully routed via elevated bypass!");
                    return 100;
                }
                return prev + 10;
            });
        }, 120);
    };

    const cityCards = [
        {
            city: "Chennai",
            state: "Tamil Nadu",
            river: "Adyar & Cooum Basin",
            focus: "Coastal Storm Canals",
            risk: "High Watch",
            riskType: "high",
            pumps: "49 / 54 Active",
            elevation: "Sea Level Basin",
            img: "/static/images/pexels-wanderinglenses-13670217.webp"
        },
        {
            city: "Mumbai",
            state: "Maharashtra",
            river: "Mithi River & Mahim Bay",
            focus: "Tidal Creek Outfalls",
            risk: "High Watch",
            riskType: "high",
            pumps: "51 / 58 Active",
            elevation: "Coastal Lowland",
            img: "/static/images/zoshua-colah-1fradOPdjBM-unsplash.webp"
        },
        {
            city: "Delhi",
            state: "NCR",
            river: "Yamuna River Basin",
            focus: "Ring Road Underpasses",
            risk: "High Watch",
            riskType: "high",
            pumps: "62 / 69 Active",
            elevation: "River Floodplain",
            img: "/static/images/dibakar-roy-KbG3OsDKkCM-unsplash.webp"
        },
        {
            city: "Kolkata",
            state: "West Bengal",
            river: "Hooghly River & Canals",
            focus: "Historic Sump Stations",
            risk: "High Watch",
            riskType: "high",
            pumps: "44 / 50 Active",
            elevation: "Delta Lowland",
            img: "/static/images/hero-kolkata-taxi-reflection.webp"
        },
        {
            city: "Bengaluru",
            state: "Karnataka",
            river: "Bellandur & Vrishabhavathi",
            focus: "Valley Storm Drains",
            risk: "Moderate",
            riskType: "mod",
            pumps: "38 / 42 Active",
            elevation: "Elevated Plateau",
            img: "/static/images/hero-aerial-drone.webp"
        },
        {
            city: "Hyderabad",
            state: "Telangana",
            river: "Musi River & Hussain Sagar",
            focus: "Storm Culvert Runoff",
            risk: "Moderate",
            riskType: "mod",
            pumps: "34 / 38 Active",
            elevation: "Deccan Basin",
            img: "/static/images/dibakar-roy-aby-GGLtD-A-unsplash.webp"
        }
    ];

    const GIS_PILLARS = [
        {
            num: "01",
            title: "3D Street Elevation Mapping",
            badge: "Terrain Heights",
            tagline: "Pinpoints low road dips and hollows where stormwater gathers first.",
            desc: "By reading high-accuracy satellite terrain heights across every street, RainDrop reveals exactly which intersections, underpasses, and neighborhood lanes sit in natural low points.",
            img: "/static/images/dibakar-roy-FbOchRlXaPs-unsplash.webp",
            benefits: ["Sub-meter street height precision", "Highlights deep road hollows", "Calculates downhill water flow", "Flags trapped water pockets"],
            tag: "Elevation Topography"
        },
        {
            num: "02",
            title: "Live Rainstorm Radar Tracking",
            badge: "Weather Radar",
            tagline: "Follows heavy cloudbursts minute-by-minute hours before rainfall peaks.",
            desc: "Streams live weather radar across every metropolitan area. It tracks storm clouds in motion so residents and municipal crews know exactly when and where heavy downpours will hit.",
            img: "/static/images/dibakar-roy-DccG84ivd3k-unsplash.webp",
            benefits: ["Live radar precipitation feed", "Storm direction and speed tracking", "5-minute cloud updates", "Up to 6 hours advance warning"],
            tag: "Radar Telemetry"
        },
        {
            num: "03",
            title: "Canals & Drainage Water Flow",
            badge: "Waterway Movement",
            tagline: "Monitors city canals, sea tides, and stormwater drainage lines.",
            desc: "Watches how water travels through underground pipes, open city canals, and river outfall gates, accounting for ocean high tides that push seawater back into neighborhood drains.",
            img: "/static/images/dibakar-roy-P7Z3HwNWPeQ-unsplash.webp",
            benefits: ["Underground pipe capacity checks", "Tide and river backflow tracking", "Canal blockage detection", "Gate opening advisories"],
            tag: "Hydrodynamics"
        },
        {
            num: "04",
            title: "Instant Street Flood Depth Alerts",
            badge: "Real-Time Depth",
            tagline: "Calculates standing water depth across every neighborhood in milliseconds.",
            desc: "Instead of waiting hours for slow simulations, our smart predictive model calculates whether a street will have 5 cm or 45 cm of water in milliseconds as rain falls.",
            img: "/static/images/hero-aerial-drone.webp",
            benefits: ["Instant depth forecasts in cm", "Door-to-door street accuracy", "Clear vehicle safety limits", "Fast response advisories"],
            tag: "Surrogate Intelligence"
        }
    ];

    const currentArt = ARTWORKS[activeArtworkIdx] || ARTWORKS[0];

    return (
        <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-start p-0 m-0 font-sans antialiased w-full overflow-x-hidden selection:bg-emerald-600 selection:text-white">
            
            {/* ========================================================================= */}
            {/* VERDE FULL-SCREEN NATURE VIDEO HERO SECTION (100vw x 100vh Full Viewport) */}
            {/* ========================================================================= */}
            <section className="relative w-full h-screen min-h-screen overflow-hidden flex flex-col justify-between">

                {/* 1. Background Video & Multi-Layer Ambient Overlays (Full Bleed Edge-to-Edge) */}
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
                    <video
                        id="bg-video"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        poster="/static/images/rain-video-poster.webp"
                        className="w-full h-full object-cover scale-[1.01] transition-transform duration-1000"
                    >
                        <source src="/static/VEDIO/RAIN.mp4" type="video/mp4" />
                        <source src="https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/nature-sunset.mp4" type="video/mp4" />
                    </video>
                    {/* Linear Top-to-Bottom Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-black/85 pointer-events-none" />
                    {/* Radial Vignette */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
                </div>

                {/* 2. Top Header & Navigation Inside Hero */}
                <header className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-6 sm:pt-8 pb-4 flex items-center justify-between">
                    {/* Brand Logo with Water Droplet / Sprout SVG */}
                    <div 
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            setActiveRailStep(0);
                        }}
                        className="group flex items-center gap-2.5 text-white tracking-[0.2em] font-light text-xl sm:text-2xl cursor-pointer transition-opacity hover:opacity-90 select-none"
                    >
                        <svg width="28" height="28" style={{ width: '28px', height: '28px', minWidth: '28px' }} className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 transition-transform duration-500 group-hover:scale-110 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22V12"></path>
                            <path d="M12 12C12 7.58172 8.41828 4 4 4C4 8.41828 7.58172 12 12 12Z"></path>
                            <path d="M12 15C12 11.134 15.134 8 19 8C19 11.866 15.866 15 12 15Z"></path>
                        </svg>
                        <span className="font-normal tracking-[0.25em]">RAINDROP</span>
                    </div>

                    {/* Desktop Navigation Links with animated underline */}
                    <nav className="hidden lg:flex items-center space-x-8 text-[12px] font-semibold tracking-[0.2em] uppercase text-white/90">
                        <button 
                            onClick={() => { scrollTo("home"); setActiveRailStep(0); }} 
                            className="hover:text-white transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white cursor-pointer"
                        >
                            LIVE RADAR
                        </button>
                        <button 
                            onClick={() => { scrollTo("coverage"); setActiveRailStep(1); }} 
                            className="hover:text-white/70 transition-colors py-1 relative group cursor-pointer"
                        >
                            CITY BASINS
                            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </button>
                        <button 
                            onClick={() => { scrollTo("data"); setActiveRailStep(0); }} 
                            className="hover:text-white/70 transition-colors py-1 relative group cursor-pointer"
                        >
                            HOW IT WORKS
                            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </button>
                        <button 
                            onClick={() => { scrollTo("solutions"); setActiveRailStep(2); }} 
                            className="hover:text-white/70 transition-colors py-1 relative group cursor-pointer"
                        >
                            SAFE ROUTES
                            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </button>
                        <button 
                            onClick={() => scrollTo("command-contact")} 
                            className="hover:text-white/70 transition-colors py-1 relative group cursor-pointer"
                        >
                            EMERGENCY
                            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </button>
                    </nav>

                    {/* Right Header Action Button */}
                    <div className="hidden lg:flex items-center">
                        <button
                            type="button"
                            onClick={() => {
                                if (onOpenMap) onOpenMap(ward, "Chennai");
                                else onEnter();
                            }}
                            className="min-h-[44px] px-6 rounded-full border border-white/80 text-white text-sm font-semibold transition-colors hover:bg-white hover:text-black cursor-pointer"
                        >
                            Open the map
                        </button>
                    </div>

                    {/* Mobile Menu Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                        aria-label="Toggle navigation menu"
                        className="lg:hidden p-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
                    >
                        {mobileDrawerOpen ? (
                            <X className="w-7 h-7" />
                        ) : (
                            <Menu className="w-7 h-7" />
                        )}
                    </button>
                </header>

                {/* Mobile Navigation Drawer */}
                {mobileDrawerOpen && (
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl z-40 lg:hidden flex flex-col justify-between p-8 pt-24 animate-fadeIn">
                        <div className="flex flex-col space-y-5 text-center">
                            <button onClick={() => { scrollTo("home"); setMobileDrawerOpen(false); }} className="text-2xl font-editorial text-white tracking-widest hover:text-emerald-300 transition-colors">LIVE RADAR</button>
                            <button onClick={() => { scrollTo("coverage"); setMobileDrawerOpen(false); }} className="text-2xl font-editorial text-white/80 tracking-widest hover:text-emerald-300 transition-colors">CITY BASINS</button>
                            <button onClick={() => { scrollTo("data"); setMobileDrawerOpen(false); }} className="text-2xl font-editorial text-white/80 tracking-widest hover:text-emerald-300 transition-colors">HOW IT WORKS</button>
                            <button onClick={() => { scrollTo("solutions"); setMobileDrawerOpen(false); }} className="text-2xl font-editorial text-white/80 tracking-widest hover:text-emerald-300 transition-colors">SAFE ROUTES</button>
                            <button onClick={() => { scrollTo("command-contact"); setMobileDrawerOpen(false); }} className="text-2xl font-editorial text-white/80 tracking-widest hover:text-emerald-300 transition-colors">EMERGENCY</button>
                        </div>
                        <div className="flex flex-col items-center space-y-5 pt-4 border-t border-white/10">
                            <button
                                onClick={() => {
                                    setMobileDrawerOpen(false);
                                    if (onOpenMap) onOpenMap(ward, "Chennai");
                                    else onEnter();
                                }}
                                className="w-full text-center min-h-[48px] rounded-full border border-white/80 text-white text-base font-semibold hover:bg-white hover:text-black transition-colors"
                            >
                                Open the map
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Main Hero Core Content */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 my-auto pb-16 sm:pb-20">
                    <div className="max-w-3xl">
                        <h1 className="font-editorial text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[0.98] tracking-[-0.01em] font-bold text-white text-glow">
                            Is my street<br />going to flood?
                        </h1>

                        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-white/90 font-medium max-w-xl leading-relaxed text-glow">
                            Pick your city to see the estimated water depth in your ward, and whether you can
                            get through on foot, on a two-wheeler or by car.
                        </p>

                        {/*
                          Primary action, placed above everything else on the page. A citizen
                          deciding whether to set out should not have to scroll past a video
                          hero and a carousel to find out.
                        */}
                        <div className="mt-7 sm:mt-9">
                            <p className="text-sm font-semibold text-white/80 mb-2.5" id="city-picker-label">
                                Check my street
                            </p>
                            <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby="city-picker-label">
                                {["Chennai", "Mumbai", "Delhi"].map((city) => (
                                    <button
                                        key={city}
                                        type="button"
                                        onClick={() => {
                                            if (onOpenMap) onOpenMap(ward, city);
                                            else onEnter();
                                        }}
                                        className="inline-flex items-center justify-center min-h-[48px] px-6 bg-white text-slate-900 font-bold text-base rounded-lg shadow-xl transition-colors hover:bg-slate-100 active:scale-[0.98] cursor-pointer"
                                    >
                                        {city}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => scrollTo("coverage")}
                                    className="inline-flex items-center justify-center min-h-[48px] px-6 border-2 border-white/80 text-white font-semibold text-base rounded-lg transition-colors hover:bg-white/15 cursor-pointer"
                                >
                                    Other cities
                                </button>
                            </div>
                            <p className="mt-3.5 text-sm text-white/75 max-w-lg">
                                Estimates from rainfall forecasts. Not an official IMD or NDMA warning.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Bottom-Right White Cutout Tab with Concave Fillet */}
                <div className="absolute bottom-0 right-0 z-30 bg-white text-black px-6 sm:px-10 py-4 sm:py-5 rounded-tl-[24px] flex items-center gap-3 shadow-2xl">
                    {/* Left Inverted Fillet (Concave Corner) */}
                    <svg width="24" height="24" style={{ width: '24px', height: '24px' }} className="absolute bottom-0 -left-[24px] w-6 h-6 text-white pointer-events-none" viewBox="0 0 24 24" fill="none">
                        <path d="M0,24 A24,24 0 0,0 24,0 L24,24 Z" fill="currentColor"></path>
                    </svg>

                    {/* Water Sprout Logo Icon */}
                    <svg width="20" height="20" style={{ width: '20px', height: '20px', minWidth: '20px' }} className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22V12"></path>
                        <path d="M12 12C12 7.58172 8.41828 4 4 4C4 8.41828 7.58172 12 12 12Z"></path>
                        <path d="M12 15C12 11.134 15.134 8 19 8C19 11.866 15.866 15 12 15Z"></path>
                    </svg>
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-black">
                        <span>HOURLY RAINFALL FORECAST</span>
                        <span className="text-black/40">•</span>
                        <span>WARD-LEVEL DEPTH ESTIMATES</span>
                        <span className="text-black/40">•</span>
                        <span>6 INDIAN CITIES</span>
                    </div>
                </div>

            </section>

            {/* ========================================================================= */}
            {/* EDITORIAL GIS CAROUSEL SECTION — Dark Card Filmstrip                      */}
            {/* ========================================================================= */}
            <section
                className="w-full bg-white border-t border-neutral-200 text-neutral-900 font-sans"
                style={{ paddingTop: '96px', paddingBottom: '0' }}
            >
                {/* ── Header (constrained) ── */}
                <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 mb-12">
                    {/* "OUR FOCUS AREAS" label with flanking lines */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <span style={{ flex: '0 0 60px', height: '1px', background: '#93c5fd' }} />
                        <span
                            className="font-bebas uppercase tracking-[0.35em] text-sky-500"
                            style={{ fontSize: '13px', letterSpacing: '0.3em' }}
                        >
                            OUR FOCUS AREAS
                        </span>
                        <span style={{ flex: '0 0 60px', height: '1px', background: '#93c5fd' }} />
                    </div>

                    {/* Main title — centred */}
                    <h2
                        className="font-bebas text-center text-neutral-950 uppercase leading-[0.9] tracking-wide"
                        style={{ fontSize: 'clamp(28px, 5.5vw, 80px)', marginBottom: '12px', letterSpacing: '0.02em' }}
                    >
                        DATA-DRIVEN SOLUTIONS FOR SAFER CITIES
                    </h2>

                    {/* Subtitle — centred */}
                    <p
                        className="font-bebas text-center text-neutral-500 uppercase tracking-[0.18em]"
                        style={{ fontSize: '12px', marginBottom: '0' }}
                    >
                        EXPLORE KEY USE CASES WHERE REAL-TIME GEOSPATIAL DATA AND FORECASTING CREATE MEASURABLE IMPACT.
                    </p>

                    {/* VIEW ALL PROJECTS — absolute top-right */}
                    <button
                        type="button"
                        onClick={() => {
                            const el = document.getElementById('cities');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="font-bebas uppercase tracking-widest text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                        style={{
                            position: 'absolute',
                            top: '0',
                            right: '56px',
                            fontSize: '12px',
                            letterSpacing: '0.12em',
                            border: '1.5px solid #737373',
                            borderRadius: '999px',
                            padding: '8px 20px',
                        }}
                    >
                        VIEW ALL PROJECTS
                    </button>
                </div>

                {/* ── Full-bleed Filmstrip Stage ── */}
                <div
                    className="w-full select-none"
                    style={{ overflow: 'hidden', paddingTop: '28px', paddingBottom: '16px', minHeight: '490px' }}
                    onMouseEnter={() => setIsCarouselHovered(true)}
                    onMouseLeave={() => setIsCarouselHovered(false)}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: `${carouselGap}px`,
                            transform: `translate3d(${translateX}px, 0, 0)`,
                            transition: isTransitioning
                                ? 'transform 750ms cubic-bezier(0.25, 1, 0.5, 1)'
                                : 'none',
                            willChange: 'transform',
                        }}
                    >
                        {EXTENDED_SLIDES.map((art, idx) => {
                            const isCurrent = idx === slideIndex;
                            return (
                                <div
                                    key={`${art.num}-${idx}`}
                                    onClick={() => {
                                        setIsTransitioning(true);
                                        setSlideIndex(idx);
                                    }}
                                    style={{
                                        position: 'relative',
                                        flexShrink: '0',
                                        cursor: 'pointer',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: isCurrent
                                            ? '0 24px 64px rgba(0,0,0,0.38)'
                                            : '0 8px 24px rgba(0,0,0,0.16)',
                                        width: `${isCurrent ? cardWidthActive : cardWidthInactive}px`,
                                        height: isCurrent ? '430px' : '350px',
                                        transform: isCurrent ? 'translateY(-16px)' : 'translateY(0)',
                                        opacity: isCurrent ? 1 : 0.72,
                                        transition: isTransitioning
                                            ? 'width 750ms cubic-bezier(0.25, 1, 0.5, 1), height 750ms cubic-bezier(0.25, 1, 0.5, 1), transform 750ms cubic-bezier(0.25, 1, 0.5, 1), opacity 750ms ease, box-shadow 750ms ease'
                                            : 'none',
                                        willChange: 'transform, width',
                                    }}
                                >
                                    {/* Full-card background image */}
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src={art.img}
                                        alt={art.title}
                                        style={{
                                            position: 'absolute',
                                            inset: '0',
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'center',
                                            display: 'block',
                                        }}
                                    />

                                    {/* Dark gradient overlay — stronger at bottom */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: '0',
                                            background: isCurrent
                                                ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.15) 100%)'
                                                : 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%)',
                                        }}
                                    />

                                    {/* Top label row: "02 — COASTAL DYNAMICS" */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '18px',
                                            left: '18px',
                                            right: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                        }}
                                    >
                                        <span
                                            className="font-bebas text-white"
                                            style={{ fontSize: '14px', letterSpacing: '0.12em', opacity: 0.9 }}
                                        >
                                            {art.num}
                                        </span>
                                        <span
                                            style={{
                                                width: '24px',
                                                height: '1px',
                                                background: 'rgba(255,255,255,0.5)',
                                                flexShrink: '0',
                                            }}
                                        />
                                        <span
                                            className="font-bebas text-white uppercase"
                                            style={{ fontSize: '11px', letterSpacing: '0.22em', opacity: 0.75 }}
                                        >
                                            {art.tag}
                                        </span>
                                    </div>

                                    {/* Bottom content area */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: '0',
                                            left: '0',
                                            right: '0',
                                            padding: isCurrent ? '28px' : '16px 18px',
                                        }}
                                    >
                                        {/* Category label (inactive only — shown in small) */}
                                        {!isCurrent && (
                                            <span
                                                className="font-bebas text-white uppercase block"
                                                style={{
                                                    fontSize: '9px',
                                                    letterSpacing: '0.2em',
                                                    opacity: 0.6,
                                                    marginBottom: '4px',
                                                }}
                                            >
                                                {art.tag}
                                            </span>
                                        )}

                                        {/* Title */}
                                        <h3
                                            className="font-bebas text-white uppercase leading-[0.95]"
                                            style={{
                                                fontSize: isCurrent
                                                    ? 'clamp(24px, 3vw, 44px)'
                                                    : 'clamp(13px, 1.5vw, 20px)',
                                                marginBottom: isCurrent ? '6px' : '0',
                                            }}
                                        >
                                            {art.title}
                                        </h3>

                                        {/* Active-only: subtitle + progress + button */}
                                        {isCurrent && (
                                            <>
                                                <p
                                                    className="font-bebas text-white uppercase"
                                                    style={{
                                                        fontSize: '11px',
                                                        letterSpacing: '0.15em',
                                                        opacity: 0.65,
                                                        marginBottom: '20px',
                                                    }}
                                                >
                                                    {art.subtitle}
                                                </p>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setModalArtworkIdx(
                                                                art.num === '01' ? 0 :
                                                                art.num === '02' ? 1 :
                                                                art.num === '03' ? 2 : 3
                                                            );
                                                            setShowreelModalOpen(true);
                                                        }}
                                                        className="font-bebas text-white uppercase hover:bg-white hover:text-black transition-all cursor-pointer"
                                                        style={{
                                                            fontSize: '12px',
                                                            letterSpacing: '0.15em',
                                                            border: '1.5px solid rgba(255,255,255,0.7)',
                                                            borderRadius: '999px',
                                                            padding: '7px 20px',
                                                        }}
                                                    >
                                                        EXPLORE PROJECT
                                                    </button>
                                                    <span
                                                        className="font-bebas text-white"
                                                        style={{
                                                            fontSize: '13px',
                                                            letterSpacing: '0.1em',
                                                            opacity: 0.45,
                                                        }}
                                                    >
                                                        {art.num} / 04
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        {/* Inactive slide: slide number / 04 */}
                                        {!isCurrent && (
                                            <span
                                                className="font-bebas text-white block"
                                                style={{
                                                    fontSize: '10px',
                                                    letterSpacing: '0.12em',
                                                    opacity: 0.4,
                                                    marginTop: '4px',
                                                }}
                                            >
                                                {art.num} / 04
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Dot Pagination ── */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '20px',
                        marginBottom: '20px',
                    }}
                >
                    {ARTWORKS.map((art, idx) => {
                        const isActive = idx === activeProjectIdx;
                        return (
                            <button
                                key={art.num}
                                type="button"
                                onClick={() => handleDotClick(idx)}
                                aria-label={`Go to slide ${art.num}`}
                                style={{
                                    width: isActive ? '28px' : '8px',
                                    height: '8px',
                                    borderRadius: '999px',
                                    background: isActive ? '#2563eb' : '#d1d5db',
                                    border: 'none',
                                    padding: '0',
                                    cursor: 'pointer',
                                    transition: 'width 300ms ease, background 300ms ease',
                                }}
                            />
                        );
                    })}
                </div>

                {/* ── Bottom Tagline Strip ── */}
                <div
                    className="w-full max-w-7xl mx-auto"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid #e5e7eb',
                        borderRadius: '999px',
                        padding: '14px 32px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        marginBottom: '0',
                        background: '#fafafa',
                        maxWidth: '1280px',
                        width: 'calc(100% - 48px)',
                    }}
                >
                    <p
                        className="font-bebas text-neutral-500 uppercase"
                        style={{ fontSize: '11px', letterSpacing: '0.18em' }}
                    >
                        FROM RIVERS TO COASTLINES TO URBAN STREETS — TURNING REAL-TIME DATA INTO SAFER, MORE RESILIENT CITIES.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: '0' }}>
                        <span style={{ width: '1px', height: '18px', background: '#d1d5db' }} />
                        <button
                            type="button"
                            onClick={() => {
                                const el = document.getElementById('cities');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="font-bebas text-sky-600 uppercase hover:text-sky-800 transition-colors cursor-pointer"
                            style={{ fontSize: '11px', letterSpacing: '0.18em', background: 'none', border: 'none', padding: '0' }}
                        >
                            LEARN MORE
                        </button>
                    </div>
                </div>
                <div style={{ height: '32px' }} />
            </section>


            {/* ========================================================================= */}
            {/* FULLSCREEN NATURE VIDEO MODAL POPUP                                       */}
            {/* ========================================================================= */}
            {showreelModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 sm:p-10 transition-opacity duration-500"
                    onClick={() => setShowreelModalOpen(false)}
                >
                    <div 
                        className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setShowreelModalOpen(false)}
                            aria-label="Close modal" 
                            className="absolute top-4 right-4 z-10 px-4 py-2 rounded bg-black/80 text-white font-bebas text-sm tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer"
                        >
                            CLOSE
                        </button>
                        <video 
                            id="modal-video" 
                            controls 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                            poster={ARTWORKS[modalArtworkIdx ?? activeProjectIdx]?.img}
                        >
                            <source src="/static/VEDIO/RAIN.mp4" type="video/mp4" />
                            <source src="https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/nature-sunset.mp4" type="video/mp4" />
                        </video>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* ========================================================================= */}
            {/* BELOW-SLIDESHOW CONTAINER: Light Architectural Environmental Dashboard    */}
            {/* ========================================================================= */}
            <div className="w-full bg-gradient-to-b from-[#D4E8F2] via-[#C5E1EE] to-[#B3D7E9] text-slate-900 relative">
                {/* Main Full-Width Container with Pleasing Human-Eye Margins */}
                <div className="w-full px-5 sm:px-10 lg:px-14 xl:px-18 mx-auto flex flex-col">

                    {/* ========================================================================= */}
                    {/* SECTION 01: PILLARS — Visual Environmental Intelligence (4 Pillars)       */}
                    {/* ========================================================================= */}
                    <section id="data" className="relative py-20 sm:py-28 w-full flex flex-col gap-10 sm:gap-12 border-b border-[#9DC6DA]">
                        {/* Section Header */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#9DC6DA] pb-8 sm:pb-10">
                            <div className="max-w-4xl">
                                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-md bg-sky-100/90 border border-sky-300 text-sky-900 font-mono text-xs font-bold tracking-wider uppercase shadow-xs">
                                    <Layers className="w-3.5 h-3.5 text-sky-700" />
                                    <span>SYSTEM PILLARS // 01</span>
                                </div>
                                <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-900 mt-4 tracking-tight leading-[1.12]">
                                    How RainDrop Sees &amp; Understands Urban Rainfall
                                </h2>
                                <p className="text-slate-700 text-lg sm:text-xl lg:text-2xl mt-4 leading-relaxed font-sans font-light">
                                    From high-accuracy street terrain heights to real-time weather radar, four integrated intelligence layers predict street runoff before storm centers peak.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    if (window._openGisSpecsModal) window._openGisSpecsModal();
                                    else if (pushToast) pushToast("Opening Data Specifications");
                                }}
                                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold tracking-wide uppercase transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                            >
                                <Sliders className="w-4 h-4 text-sky-200" />
                                <span>Inspect Data Layers</span>
                            </button>
                        </div>

                        {/* 4 Separate Channel Cards with Pleasant Gaps */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                            {GIS_PILLARS.map((pillar, idx) => (
                                <button
                                    key={pillar.num}
                                    type="button"
                                    onClick={() => setActivePillarTab(idx)}
                                    className={`text-left p-6 sm:p-7 rounded-2xl border transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                                        activePillarTab === idx
                                            ? "bg-white border-sky-600 ring-2 ring-sky-500/30 -translate-y-1"
                                            : "bg-white/85 border-[#9DC6DA] hover:bg-white hover:border-sky-400"
                                    }`}
                                >
                                    {/* Active Highlight Top Indicator */}
                                    {activePillarTab === idx && (
                                        <div className="absolute top-0 left-6 right-6 h-1 bg-sky-600 rounded-full" />
                                    )}

                                    <div className="flex items-center justify-between w-full mb-3.5">
                                        <span className={`font-mono text-sm font-bold tracking-wider ${
                                            activePillarTab === idx ? "text-sky-700" : "text-slate-400"
                                        }`}>
                                            [{pillar.num}]
                                        </span>
                                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm border ${
                                            activePillarTab === idx
                                                ? "bg-sky-100 text-sky-900 border-sky-300"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                        }`}>
                                            {pillar.badge}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className={`font-sans font-bold text-lg sm:text-xl transition-colors ${
                                            activePillarTab === idx ? "text-slate-900" : "text-slate-800"
                                        }`}>
                                            {pillar.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 mt-2 font-sans font-normal leading-relaxed">
                                            {pillar.tagline}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Separate Panoramic Telemetry Showcase with Generous Spacing */}
                        <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-white/95 border border-[#9DC6DA] shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
                            {/* Left: Large Photography Viewport (7 Cols) */}
                            <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[420px] lg:min-h-[460px] rounded-2xl overflow-hidden bg-slate-950 border border-[#B3D6E6] group shadow-inner">
                                <img
                                    loading="lazy"
                                    decoding="async"
                                    src={GIS_PILLARS[activePillarTab].img}
                                    alt={GIS_PILLARS[activePillarTab].title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                                {/* High-Tech Top Overlay Badge */}
                                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 px-3.5 py-1.5 rounded-md font-mono text-xs text-sky-950 font-bold uppercase tracking-wider shadow-xs">
                                        <Activity className="w-3.5 h-3.5 text-sky-700 animate-pulse" />
                                        <span>SENSOR STREAM: {GIS_PILLARS[activePillarTab].tag}</span>
                                    </div>
                                    <div className="hidden sm:block font-mono text-xs text-slate-700 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-200 font-semibold shadow-xs">
                                        FPS: 60 · LATENCY: 11.2ms
                                    </div>
                                </div>

                                {/* Bottom Image Info */}
                                <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
                                    <span className="font-mono text-xs uppercase tracking-widest text-sky-400 font-bold block mb-1">
                                        LIVE ENVIRONMENTAL OBSERVATION
                                    </span>
                                    <h4 className="text-2xl sm:text-3xl font-editorial text-white">
                                        {GIS_PILLARS[activePillarTab].title}
                                    </h4>
                                </div>
                            </div>

                            {/* Right: Technical Telemetry Readout (5 Cols) */}
                            <div className="lg:col-span-5 flex flex-col justify-between gap-6 sm:gap-8">
                                <div>
                                    <div className="flex items-center justify-between border-b border-[#B3D6E6] pb-3 mb-5">
                                        <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold">
                                            LAYER ANALYSIS // SPEC 0{activePillarTab + 1}
                                        </span>
                                        <span className="font-mono text-xs text-sky-700 font-bold">
                                            REAL-TIME DATA READY
                                        </span>
                                    </div>

                                    <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-sans">
                                        {GIS_PILLARS[activePillarTab].desc}
                                    </p>

                                    <div className="mt-6 sm:mt-7 space-y-3.5">
                                        <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold block">
                                            OPERATIONAL CAPABILITIES
                                        </span>
                                        {GIS_PILLARS[activePillarTab].benefits.map((benefit) => (
                                            <div key={benefit} className="flex items-start gap-3 text-base text-slate-800 font-medium">
                                                <div className="w-2.5 h-2.5 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                                                <span>{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-[#B3D6E6] flex items-center justify-between">
                                    <div className="font-mono text-xs text-slate-600">
                                        UPDATE CADENCE: <strong className="text-slate-900">EVERY 60 SEC</strong>
                                    </div>
                                    <button
                                        onClick={() => onOpenMap(ward, "Chennai")}
                                        className="flex items-center gap-1.5 font-sans text-sm font-bold text-sky-700 hover:text-sky-800 transition-colors cursor-pointer"
                                    >
                                        <span>Open City Map</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* SECTION 02: COVERAGE — 6 Monitored Metropolitan Basins                    */}
                    {/* ========================================================================= */}
                    <section id="coverage" className="relative py-20 sm:py-28 w-full flex flex-col gap-10 sm:gap-12 border-b border-[#9DC6DA]">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#9DC6DA] pb-8 sm:pb-10">
                            <div className="max-w-4xl">
                                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-md bg-sky-100/90 border border-sky-300 text-sky-900 font-mono text-xs font-bold tracking-wider uppercase shadow-xs">
                                    <Waves className="w-3.5 h-3.5 text-sky-700" />
                                    <span>URBAN BASIN MATRIX // 02</span>
                                </div>
                                <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-900 mt-4 tracking-tight leading-[1.12]">
                                    Flood estimates for six Indian cities
                                </h2>
                                <p className="text-slate-700 text-lg sm:text-xl lg:text-2xl mt-4 leading-relaxed font-sans font-light">
                                    Rainfall forecasts refreshed through the day for six Indian cities, turned into
                                    ward-level flood depth estimates. Chennai, Mumbai and Delhi are the best covered.
                                    Select a city to see the current estimate and how it was produced.
                                </p>
                            </div>

                            <button
                                onClick={onEnter}
                                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                            >
                                <span>Explore All Metros</span>
                                <ArrowRight className="w-4 h-4 text-sky-400" />
                            </button>
                        </div>

                        {/* 6 City Cards Grid with Pleasant Spacing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {cityCards.map((item) => (
                                <div
                                    key={item.city}
                                    onClick={() => {
                                        if (onSelectCity) onSelectCity(item.city);
                                        else onEnter();
                                    }}
                                    className="group relative rounded-2xl bg-white/95 border border-[#9DC6DA] hover:border-sky-600 shadow-sm hover:shadow-xl transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between hover:-translate-y-1.5 overflow-hidden"
                                >
                                    {/* City Photo Header */}
                                    <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
                                        <img
                                            loading="lazy"
                                            decoding="async"
                                            src={item.img}
                                            alt={`${item.city} Skyline and Waterway`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                                        
                                        {/* Risk Badge */}
                                        <div className="absolute top-4 right-4">
                                            <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${
                                                item.riskType === "high"
                                                    ? "bg-rose-100 text-rose-900 border border-rose-300"
                                                    : "bg-amber-100 text-amber-900 border border-amber-300"
                                            }`}>
                                                {item.risk}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-4 left-6 right-6">
                                            <span className="font-mono text-xs text-sky-300 font-bold uppercase tracking-widest">{item.state}</span>
                                            <h3 className="font-editorial text-3xl sm:text-4xl text-white group-hover:text-sky-300 transition-colors mt-0.5">
                                                {item.city}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Body Specs in Layman Terms */}
                                    <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                                        <div className="space-y-3.5 text-base text-slate-700 font-sans">
                                            <div className="flex items-center justify-between border-b border-[#B3D6E6]/70 pb-3">
                                                <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">Primary Waterway</span>
                                                <span className="font-bold text-slate-900">{item.river}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-[#B3D6E6]/70 pb-3">
                                                <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">Key Focus</span>
                                                <span className="text-slate-800 font-medium">{item.focus}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">Elevation Profile</span>
                                                <span className="text-sky-800 font-mono text-sm font-semibold">{item.elevation}</span>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="mt-7 pt-5 border-t border-[#B3D6E6] flex items-center justify-between">
                                            <div>
                                                <span className="text-base font-bold text-slate-900 block">
                                                    {item.pumps}
                                                </span>
                                                <span className="text-xs text-slate-500 block">
                                                    Drainage Pumps Ready
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-base font-bold text-sky-700 group-hover:text-sky-800 transition-colors">
                                                <span>Open City Map</span>
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* SECTION 03: CITIZEN IMPACT & TRANSIT SAFETY (4 Pictorial Cards)            */}
                    {/* ========================================================================= */}
                    <section id="solutions" className="relative py-20 sm:py-28 w-full flex flex-col gap-10 sm:gap-12">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#9DC6DA] pb-8 sm:pb-10">
                            <div className="max-w-4xl">
                                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-md bg-sky-100/90 border border-sky-300 text-sky-900 font-mono text-xs font-bold tracking-wider uppercase shadow-xs">
                                    <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
                                    <span>CIVIL PROTECTION &amp; CITIZEN SAFETY // 03</span>
                                </div>
                                <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-900 mt-4 tracking-tight leading-[1.12]">
                                    Real Problems Citizens Face — And How We Solve Them
                                </h2>
                                <p className="text-slate-700 text-lg sm:text-xl lg:text-2xl mt-4 leading-relaxed font-sans font-light">
                                    Monsoon deluges shouldn't cause flooded vehicles, stranded commuters, or waterlogged neighborhoods. Here is how real-time insights protect daily life.
                                </p>
                            </div>

                            <button
                                onClick={onEnter}
                                className="flex items-center gap-1.5 text-base font-bold text-sky-800 hover:text-sky-900 transition-colors cursor-pointer shrink-0"
                            >
                                <span>Explore All Hotspots</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 4 Large Pictorial Impact Cards with Pleasant Gaps */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                            {/* Card 1: Monsoon Bus Splash */}
                            <div 
                                onClick={() => { if (onSelectCity) onSelectCity("Kolkata"); else onEnter(); }}
                                className="group rounded-2xl bg-white/95 border border-[#9DC6DA] hover:border-sky-600 transition-all duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1.5 shadow-sm hover:shadow-xl"
                            >
                                <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-900">
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src="/static/images/hero-monsoon-bus-splash.webp"
                                        alt="City Bus moving through heavy rainwater"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/95 text-slate-900 text-xs font-bold px-3 py-1 rounded-sm border border-slate-200 shadow-xs">
                                        Public Transit
                                    </div>
                                </div>
                                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                                    <div>
                                        <h3 className="font-sans font-bold text-slate-900 text-xl group-hover:text-sky-700 transition-colors">
                                            Keeping Public Buses Moving
                                        </h3>
                                        <p className="text-base text-slate-700 mt-3.5 leading-relaxed font-sans">
                                            Routes city buses away from submerged lowlands onto dry flyover bypasses before main arterial roads flood.
                                        </p>
                                    </div>
                                    <div className="mt-7 flex items-center justify-between text-sm border-t border-[#B3D6E6] pt-4">
                                        <span className="font-bold text-sky-800">✓ Zero Stranded Commuters</span>
                                        <span className="text-sky-700 font-bold group-hover:translate-x-1 transition-transform">See Live →</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Vehicle Engine Protection */}
                            <div 
                                onClick={() => { if (onSelectCity) onSelectCity("Kolkata"); else onEnter(); }}
                                className="group rounded-2xl bg-white/95 border border-[#9DC6DA] hover:border-amber-600 transition-all duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1.5 shadow-sm hover:shadow-xl"
                            >
                                <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-900">
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src="/static/images/pexels-dibakar-roy-2432543-18192646.webp"
                                        alt="Car driving through rain street reflection"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/95 text-amber-900 text-xs font-bold px-3 py-1 rounded-sm border border-amber-200 shadow-xs">
                                        Vehicle Safety
                                    </div>
                                </div>
                                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                                    <div>
                                        <h3 className="font-sans font-bold text-slate-900 text-xl group-hover:text-amber-800 transition-colors">
                                            Preventing Engine Damage
                                        </h3>
                                        <p className="text-base text-slate-700 mt-3.5 leading-relaxed font-sans">
                                            Flags exact street puddle depths before you drive in, preventing engine water intake and expensive vehicle repairs.
                                        </p>
                                    </div>
                                    <div className="mt-7 flex items-center justify-between text-sm border-t border-[#B3D6E6] pt-4">
                                        <span className="font-semibold text-slate-700">Depth estimate, not a measurement</span>
                                        <span className="text-sky-700 font-bold group-hover:translate-x-1 transition-transform">See Live →</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Riverside Community Safety */}
                            <div 
                                onClick={() => { if (onSelectCity) onSelectCity("Delhi"); else onEnter(); }}
                                className="group rounded-2xl bg-white/95 border border-[#9DC6DA] hover:border-teal-600 transition-all duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1.5 shadow-sm hover:shadow-xl"
                            >
                                <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-900">
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src="/static/images/hero-river-ghats-aerial-hd.webp"
                                        alt="Riverside community and riverfront view"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/95 text-teal-900 text-xs font-bold px-3 py-1 rounded-sm border border-teal-200 shadow-xs">
                                        River Safety
                                    </div>
                                </div>
                                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                                    <div>
                                        <h3 className="font-sans font-bold text-slate-900 text-xl group-hover:text-teal-800 transition-colors">
                                            Protecting Riverside Areas
                                        </h3>
                                        <p className="text-base text-slate-700 mt-3.5 leading-relaxed font-sans">
                                            Continuous river gauges upstream give residents and authorities up to 6 hours of advance notice before river levels peak.
                                        </p>
                                    </div>
                                    <div className="mt-7 flex items-center justify-between text-sm border-t border-[#B3D6E6] pt-4">
                                        <span className="font-bold text-teal-800">✓ 6h Advance Surge Notice</span>
                                        <span className="text-sky-700 font-bold group-hover:translate-x-1 transition-transform">See Live →</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Proactive Pump Station Dewatering */}
                            <div 
                                onClick={() => { if (onSelectCity) onSelectCity("Chennai"); else onEnter(); }}
                                className="group rounded-2xl bg-white/95 border border-[#9DC6DA] hover:border-sky-600 transition-all duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1.5 shadow-sm hover:shadow-xl"
                            >
                                <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-900">
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src="/static/images/pexels-dibakar-roy-2432543-19391751.webp"
                                        alt="Drainage canal pumps in action"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/95 text-sky-900 text-xs font-bold px-3 py-1 rounded-sm border border-sky-200 shadow-xs">
                                        Pump Activation
                                    </div>
                                </div>
                                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                                    <div>
                                        <h3 className="font-sans font-bold text-slate-900 text-xl group-hover:text-sky-700 transition-colors">
                                            Proactive Pump Activation
                                        </h3>
                                        <p className="text-base text-slate-700 mt-3.5 leading-relaxed font-sans">
                                            Alerts municipal drainage teams where stormwater will pool so heavy pumps start draining sumps well before water overflows.
                                        </p>
                                    </div>
                                    <div className="mt-7 flex items-center justify-between text-sm border-t border-[#B3D6E6] pt-4">
                                        <span className="font-bold text-sky-800">✓ Automated Sump Clearing</span>
                                        <span className="text-sky-700 font-bold group-hover:translate-x-1 transition-transform">See Live →</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

/**
 * Ready-to-invoke Developer Social Handles & Confirmed Project Intelligence Component
 * Configured so it does not clutter the primary UI directly, and is ready for invocation whenever needed.
 * Can be triggered via window._openDeveloperProfile() or state.
 */