/**
 * Should we download the 46 MB background video?
 *
 * Only on a wide screen, over a connection that has not asked us to save data,
 * for someone who has not asked for reduced motion. Everyone else gets the
 * 204 KB poster, which carries the same meaning. During the monsoon, on a
 * phone, on a congested network, this is the difference between a page that
 * loads and one that does not.
 */
function useBackgroundVideo() {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        const connection = navigator.connection || {};
        const wantsLessData = connection.saveData === true ||
            /^(slow-2g|2g|3g)$/.test(connection.effectiveType || "");
        const wantsLessMotion = window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const isWideScreen = window.matchMedia &&
            window.matchMedia("(min-width: 1024px)").matches;

        setShouldLoad(Boolean(isWideScreen && !wantsLessData && !wantsLessMotion));
    }, []);

    return shouldLoad;
}

function HeroView({ ward, wardData, onEnter, onSelectCity, onOpenMap, onCheckRoute, pushToast }) {
    const showBackgroundVideo = useBackgroundVideo();
    const [activePillarTab, setActivePillarTab] = useState(0);

    // CreativaX Studio State & Filmstrip Slideshow Track State
    const [slideIndex, setSlideIndex] = useState(4); // Starts at index 4 (Real 01 in middle set)
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isCarouselHovered, setIsCarouselHovered] = useState(false);
    // WCAG 2.2.2: auto-moving content needs a way to stop it that does not
    // depend on a mouse. Hover alone fails keyboard and touch users.
    const [isCarouselPaused, setIsCarouselPaused] = useState(false);
    const [isCarouselFocused, setIsCarouselFocused] = useState(false);
    const prefersReducedMotion = useMemo(
        () => typeof window !== "undefined" && window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        []
    );
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
            key: "route",
            title: "Can I get through?",
            subtitle: "Walking, two-wheeler, car or bus",
            desc: "Enter the depth you can see and get advice for each way of travelling, plus the elevated road on file for your city.",
            img: "/static/images/hero-monsoon-bus-splash.webp",
            alt: "A city bus driving through deep standing water",
            tag: "Getting through",
            actionLabel: "Check a route",
            onAction: () => (onCheckRoute ? onCheckRoute("Chennai") : onOpenMap(ward, "Chennai")),
        },
        {
            key: "mumbai",
            title: "Mumbai, where the tide meets the drains",
            subtitle: "Mithi river and Mahim Bay",
            desc: "Low wards along the Mithi flood first. High tide can lock the outfalls, which the estimate does not model yet, so read it as a lower bound at high tide.",
            img: "/static/images/hero-mumbai-harbor-boats.webp",
            alt: "Fishing boats moored in Mumbai harbour with the skyline behind",
            tag: "Focus city",
            actionLabel: "Open Mumbai",
            onAction: () => onOpenMap(null, "Mumbai"),
        },
        {
            key: "kolkata",
            title: "Kolkata, flat ground and slow drains",
            subtitle: "Hooghly river and city canals",
            desc: "Much of the city sits only a few metres above sea level, so rain has nowhere to run. Covered, but less closely calibrated than the focus cities.",
            img: "/static/images/hero-kolkata-taxi-reflection.webp",
            alt: "A yellow Kolkata taxi on a wet street after rain",
            tag: "Covered city",
            actionLabel: "Open Kolkata",
            onAction: () => onOpenMap(null, "Kolkata"),
        },
        {
            key: "method",
            title: "The ground decides where water collects",
            subtitle: "How the depth figure is worked out",
            desc: "Forecast rain, minus what the drains can carry, pooled into the lowest ground. Every number on the map shows its method and its limits.",
            img: "/static/images/hero-river-ghats-aerial-hd.webp",
            alt: "Aerial view of riverside steps and buildings along a river",
            tag: "How it works",
            actionLabel: "See how it works",
            onAction: () => scrollTo("data"),
        },
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
    const isCarouselStill = isCarouselHovered || isCarouselFocused || isCarouselPaused || prefersReducedMotion;

    useEffect(() => {
        if (isCarouselStill) return;
        const timer = setInterval(() => {
            setIsTransitioning(true);
            setSlideIndex((prev) => {
                if (prev >= 8) return 5;
                return prev + 1;
            });
        }, 6000);
        return () => clearInterval(timer);
    }, [isCarouselStill]);

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


    const handleDotClick = (targetIdx) => {
        setIsTransitioning(true);
        setSlideIndex(4 + targetIdx);
    };



    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    const cityCards = [
        {
            city: "Chennai",
            state: "Tamil Nadu",
            river: "Adyar & Cooum Basin",
            focus: "Coastal Storm Canals",
            focusCity: true,
            elevation: "Sea Level Basin",
            img: "/static/images/pexels-wanderinglenses-13670217.webp"
        },
        {
            city: "Mumbai",
            state: "Maharashtra",
            river: "Mithi River & Mahim Bay",
            focus: "Tidal Creek Outfalls",
            focusCity: true,
            elevation: "Coastal Lowland",
            img: "/static/images/zoshua-colah-1fradOPdjBM-unsplash.webp"
        },
        {
            city: "Delhi",
            state: "NCR",
            river: "Yamuna River Basin",
            focus: "Ring Road Underpasses",
            focusCity: true,
            elevation: "River Floodplain",
            img: "/static/images/dibakar-roy-KbG3OsDKkCM-unsplash.webp"
        },
        {
            city: "Kolkata",
            state: "West Bengal",
            river: "Hooghly River & Canals",
            focus: "Historic Sump Stations",
            focusCity: false,
            elevation: "Delta Lowland",
            img: "/static/images/hero-kolkata-taxi-reflection.webp"
        },
        {
            city: "Bengaluru",
            state: "Karnataka",
            river: "Bellandur & Vrishabhavathi",
            focus: "Valley Storm Drains",
            focusCity: false,
            elevation: "Elevated Plateau",
            img: "/static/images/hero-aerial-drone.webp"
        },
        {
            city: "Hyderabad",
            state: "Telangana",
            river: "Musi River & Hussain Sagar",
            focus: "Storm Culvert Runoff",
            focusCity: false,
            elevation: "Deccan Basin",
            img: "/static/images/dibakar-roy-aby-GGLtD-A-unsplash.webp"
        }
    ];

    const GIS_PILLARS = [
        {
            num: "01",
            title: "Where the ground is low",
            badge: "Terrain",
            tagline: "Finds the dips and hollows where rain water collects first.",
            desc: "A 30 m elevation model is filled, routed and turned into slope and flow lines, so each ward has a measure of how readily water pools there. Until a city's elevation tiles are processed, city-wide averages stand in, and the dashboard says so.",
            img: "/static/images/dibakar-roy-FbOchRlXaPs-unsplash.webp",
            alt: "Rain falling on a low-lying city street",
            benefits: ["Depression filling and flow routing", "Slope measured on a metre grid", "Sets the share of each ward that ponds", "Marked as an average until real tiles load"],
            status: "Estimate",
            statusNote: "City-wide averages until elevation tiles are processed",
        },
        {
            num: "02",
            title: "How much rain, and how fast",
            badge: "Rainfall",
            tagline: "Hourly forecast rainfall for each ward, from the current hour.",
            desc: "Hourly rainfall forecasts from Open-Meteo, refreshed through the day and checked for age. Intensity matters more than the daily total: 100 mm in three hours floods streets that 100 mm spread over a day does not.",
            img: "/static/images/dibakar-roy-DccG84ivd3k-unsplash.webp",
            alt: "Heavy monsoon rain over a city",
            benefits: ["Next 12 hours, hour by hour", "Peak intensity, not just totals", "Marked stale or offline when it lapses", "No radar feed connected yet"],
            status: "Live",
            statusNote: "Open-Meteo hourly forecast",
        },
        {
            num: "03",
            title: "What the drains can carry",
            badge: "Drainage",
            tagline: "Rain that falls faster than drains can clear it becomes surface water.",
            desc: "Each city is given a drainage rate in millimetres per hour, and rain above that rate becomes runoff. The rate is a published design figure, not a measurement of the drains as they are today. Blocked drains and high tides are not modelled.",
            img: "/static/images/dibakar-roy-P7Z3HwNWPeQ-unsplash.webp",
            alt: "Water flowing along an urban drainage channel",
            benefits: ["Drain capacity per city, in mm per hour", "Paved share sets how much rain runs off", "Tide and river backflow not modelled yet", "SWMM simulation planned for a faster model"],
            status: "Estimate",
            statusNote: "Design figures, not measured capacity",
        },
        {
            num: "04",
            title: "How deep the water gets",
            badge: "Depth",
            tagline: "Turns the excess rain into a depth for the wettest part of a ward.",
            desc: "The water the drains cannot take is pooled over the lowest part of the ward to give a depth in centimetres, then translated into whether you can walk, ride or drive through. It is an estimate for the ward, not a reading for your street.",
            img: "/static/images/hero-aerial-drone.webp",
            alt: "Aerial view of a flooded neighbourhood",
            benefits: ["Depth in centimetres, with the working shown", "Advice for walking, riding and driving", "Not yet validated against observed floods", "Not an official IMD or NDMA warning"],
            status: "Estimate",
            statusNote: "Rational method, not a trained model",
        },
    ];


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
                        preload={showBackgroundVideo ? "metadata" : "none"}
                        poster="/static/images/rain-video-poster.webp"
                        aria-hidden="true"
                        className="w-full h-full object-cover scale-[1.01]"
                    >
                        {showBackgroundVideo && <source src="/static/VEDIO/RAIN.mp4" type="video/mp4" />}
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
                            <p className="mt-3.5 text-sm font-medium text-white max-w-lg text-glow">
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
            {/* Ways in: a filmstrip of four real destinations                            */}
            {/* ========================================================================= */}
            <section
                aria-roledescription="carousel"
                aria-labelledby="ways-in-title"
                className="w-full bg-white border-t border-slate-200 text-slate-900 font-sans pt-20 sm:pt-24"
                onFocus={() => setIsCarouselFocused(true)}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setIsCarouselFocused(false);
                }}
            >
                <div className="w-full max-w-3xl mx-auto px-6 sm:px-10 text-center">
                    <h2
                        id="ways-in-title"
                        className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-900 leading-[1.05] tracking-[-0.01em]"
                        style={{ textWrap: 'balance' }}
                    >
                        Four ways into the estimate
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed" style={{ textWrap: 'pretty' }}>
                        Check whether you can get through, open a city's map, or see how the depth
                        figure is worked out.
                    </p>
                    <button
                        type="button"
                        onClick={() => scrollTo('coverage')}
                        className="mt-6 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
                    >
                        See all six cities
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                </div>

                {/* Filmstrip */}
                <div
                    className="w-full select-none mt-10"
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
                            transition: isTransitioning && !prefersReducedMotion
                                ? 'transform 750ms cubic-bezier(0.22, 1, 0.36, 1)'
                                : 'none',
                            willChange: 'transform',
                        }}
                    >
                        {EXTENDED_SLIDES.map((art, idx) => {
                            const isCurrent = idx === slideIndex;
                            const position = (idx % ARTWORKS.length) + 1;
                            return (
                                <div
                                    key={`${art.key}-${idx}`}
                                    role="group"
                                    aria-roledescription="slide"
                                    aria-label={`${position} of ${ARTWORKS.length}: ${art.title}`}
                                    // The track holds three copies for the infinite loop. Only the
                                    // current card is exposed, so a screen reader hears four
                                    // slides, not twelve.
                                    aria-hidden={!isCurrent}
                                    onClick={() => {
                                        if (isCurrent) return;
                                        setIsTransitioning(true);
                                        setSlideIndex(idx);
                                    }}
                                    style={{
                                        position: 'relative',
                                        flexShrink: '0',
                                        cursor: isCurrent ? 'default' : 'pointer',
                                        background: '#0f172a',
                                        borderRadius: '18px',
                                        overflow: 'hidden',
                                        boxShadow: isCurrent
                                            ? '0 28px 60px -18px rgba(15,23,42,0.55)'
                                            : '0 10px 24px -12px rgba(15,23,42,0.35)',
                                        width: `${isCurrent ? cardWidthActive : cardWidthInactive}px`,
                                        height: isCurrent ? '430px' : '350px',
                                        transform: isCurrent ? 'translateY(-16px)' : 'translateY(0)',
                                        opacity: isCurrent ? 1 : 0.7,
                                        transition: isTransitioning && !prefersReducedMotion
                                            ? 'width 750ms cubic-bezier(0.22, 1, 0.36, 1), height 750ms cubic-bezier(0.22, 1, 0.36, 1), transform 750ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease-out, box-shadow 600ms ease-out'
                                            : 'none',
                                        willChange: 'transform, width',
                                    }}
                                >
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src={art.img}
                                        alt={isCurrent ? art.alt : ''}
                                        width="1600"
                                        height="1067"
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

                                    <div
                                        aria-hidden="true"
                                        style={{
                                            position: 'absolute',
                                            inset: '0',
                                            background: isCurrent
                                                ? 'linear-gradient(to top, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.55) 42%, rgba(2,6,23,0.05) 78%)'
                                                : 'linear-gradient(to top, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.35) 55%, rgba(2,6,23,0.15) 100%)',
                                        }}
                                    />

                                    <span
                                        className="absolute top-4 left-4 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900"
                                    >
                                        {art.tag}
                                    </span>

                                    <div className={`absolute inset-x-0 bottom-0 ${isCurrent ? 'p-6 sm:p-8' : 'p-4'}`}>
                                        <h3
                                            className={`font-editorial font-semibold text-white leading-[1.02] ${
                                                isCurrent ? 'text-3xl sm:text-4xl lg:text-[2.75rem]' : 'text-xl'
                                            }`}
                                            style={{ textWrap: 'balance' }}
                                        >
                                            {art.title}
                                        </h3>

                                        {isCurrent && (
                                            <>
                                                <p className="mt-2 text-sm font-semibold text-white/85">
                                                    {art.subtitle}
                                                </p>
                                                <p className="mt-3 max-w-[52ch] text-sm sm:text-base leading-relaxed text-white/90" style={{ textWrap: 'pretty' }}>
                                                    {art.desc}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        art.onAction();
                                                    }}
                                                    className="mt-5 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-white text-slate-900 text-sm font-bold hover:bg-sky-50 transition-colors cursor-pointer"
                                                >
                                                    {art.actionLabel}
                                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Position, plus a pause control that works without a mouse */}
                <div className="flex items-center justify-center gap-1 mt-4 mb-6">
                    <button
                        type="button"
                        onClick={() => setIsCarouselPaused((paused) => !paused)}
                        aria-label={isCarouselPaused ? 'Resume slides' : 'Pause slides'}
                        aria-pressed={isCarouselPaused}
                        className="inline-flex items-center justify-center w-11 h-11 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        {isCarouselPaused || prefersReducedMotion
                            ? <Play className="w-3.5 h-3.5" aria-hidden="true" />
                            : <Pause className="w-3.5 h-3.5" aria-hidden="true" />}
                    </button>
                    {ARTWORKS.map((art, idx) => {
                        const isActive = idx === activeProjectIdx;
                        return (
                            <button
                                key={art.key}
                                type="button"
                                onClick={() => handleDotClick(idx)}
                                aria-label={`Show slide ${idx + 1}: ${art.title}`}
                                aria-current={isActive ? 'true' : undefined}
                                // 44 px hit area; the visible dot stays small.
                                className="inline-flex items-center justify-center w-11 h-11 rounded-full cursor-pointer group"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`block h-2 rounded-full transition-all duration-300 ${
                                        isActive ? 'w-7 bg-sky-700' : 'w-2 bg-slate-300 group-hover:bg-slate-400'
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>
                <p className="sr-only" aria-live={isCarouselStill ? 'polite' : 'off'}>
                    {`Slide ${activeProjectIdx + 1} of ${ARTWORKS.length}: ${ARTWORKS[activeProjectIdx].title}`}
                </p>

                <div className="mx-auto mb-10 flex max-w-5xl flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ width: 'calc(100% - 48px)' }}>
                    <p className="text-sm text-slate-700">
                        Every figure on this site says where it came from: live forecast, estimate or sample.
                    </p>
                    <button
                        type="button"
                        onClick={() => scrollTo('data')}
                        className="inline-flex shrink-0 items-center gap-1.5 min-h-[44px] text-sm font-bold text-sky-800 hover:text-sky-900 cursor-pointer"
                    >
                        How the estimate works
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                </div>
            </section>


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
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#9DC6DA] pb-8 sm:pb-10">
                            <div className="max-w-3xl">
                                <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-900 tracking-[-0.01em] leading-[1.05]" style={{ textWrap: 'balance' }}>
                                    How the estimate is made
                                </h2>
                                <p className="text-slate-700 text-lg sm:text-xl mt-4 leading-relaxed font-sans" style={{ textWrap: 'pretty' }}>
                                    Four steps, from the shape of the ground to the depth of the water. Each one
                                    says what it is based on and what it cannot see.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onOpenMap(null, "Chennai")}
                                className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold transition-colors cursor-pointer shrink-0"
                            >
                                See it on the map
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
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
                                    alt={GIS_PILLARS[activePillarTab].alt}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" aria-hidden="true" />

                                <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900">
                                    Step {activePillarTab + 1} of 4: {GIS_PILLARS[activePillarTab].badge}
                                </span>

                                <h3 className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 text-3xl sm:text-4xl font-editorial font-semibold text-white leading-[1.05]" style={{ textWrap: 'balance' }}>
                                    {GIS_PILLARS[activePillarTab].title}
                                </h3>
                            </div>

                            {/* Right: what this step does, and how much to trust it */}
                            <div className="lg:col-span-5 flex flex-col justify-between gap-6 sm:gap-8">
                                <div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#B3D6E6] pb-3 mb-5">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                                            GIS_PILLARS[activePillarTab].status === "Live"
                                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                                : "border-sky-300 bg-sky-50 text-sky-900"
                                        }`}>
                                            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${
                                                GIS_PILLARS[activePillarTab].status === "Live" ? "bg-emerald-600" : "bg-sky-600"
                                            }`} />
                                            {GIS_PILLARS[activePillarTab].status}
                                        </span>
                                        <span className="text-sm text-slate-700">
                                            {GIS_PILLARS[activePillarTab].statusNote}
                                        </span>
                                    </div>

                                    <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-sans max-w-[60ch]" style={{ textWrap: 'pretty' }}>
                                        {GIS_PILLARS[activePillarTab].desc}
                                    </p>

                                    <h4 className="mt-6 sm:mt-7 text-sm font-bold text-slate-900">
                                        What it does today
                                    </h4>
                                    <ul className="mt-3 space-y-3">
                                        {GIS_PILLARS[activePillarTab].benefits.map((benefit) => (
                                            <li key={benefit} className="flex items-start gap-3 text-base text-slate-800">
                                                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-sky-600 mt-2 shrink-0" />
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-5 border-t border-[#B3D6E6] flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm text-slate-700">
                                        Rainfall updates hourly. Depths recompute with it.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => onOpenMap(null, "Chennai")}
                                        className="inline-flex items-center gap-1.5 min-h-[44px] font-sans text-sm font-bold text-sky-800 hover:text-sky-900 transition-colors cursor-pointer"
                                    >
                                        Open the map
                                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
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
                                <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-900 tracking-[-0.01em] leading-[1.05]" style={{ textWrap: 'balance' }}>
                                    Flood estimates for six Indian cities
                                </h2>
                                <p className="text-slate-700 text-lg sm:text-xl lg:text-2xl mt-4 leading-relaxed font-sans font-light">
                                    Rainfall forecasts refreshed through the day for six Indian cities, turned into
                                    ward-level flood depth estimates. Chennai, Mumbai and Delhi are the best covered.
                                    Select a city to see the current estimate and how it was produced.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onEnter}
                                className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors cursor-pointer shrink-0"
                            >
                                Compare all cities
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>

                        {/* 6 City Cards Grid with Pleasant Spacing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {cityCards.map((item) => {
                                const wardCount = Object.values(WARDS_DATA).filter((ward) => ward.city === item.city).length;
                                return (
                                <button
                                    key={item.city}
                                    type="button"
                                    onClick={() => {
                                        if (onSelectCity) onSelectCity(item.city);
                                        else onEnter();
                                    }}
                                    className="group relative text-left rounded-2xl bg-white border border-[#9DC6DA] hover:border-sky-600 shadow-sm hover:shadow-lg transition-[border-color,box-shadow,transform] duration-300 ease-out cursor-pointer flex flex-col justify-between hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
                                        <img
                                            loading="lazy"
                                            decoding="async"
                                            src={item.img}
                                            alt=""
                                            width="1600"
                                            height="1067"
                                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" aria-hidden="true" />

                                        {/* Coverage, not risk. A risk badge here was hardcoded and
                                            never reflected the weather. */}
                                        <span className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-semibold border ${
                                            item.focusCity
                                                ? "bg-white text-slate-900 border-white"
                                                : "bg-slate-900/70 text-white border-white/30"
                                        }`}>
                                            {item.focusCity ? "Focus city" : "Less calibrated"}
                                        </span>

                                        <div className="absolute bottom-4 left-6 right-6">
                                            <span className="text-sm font-semibold text-sky-200">{item.state}</span>
                                            <h3 className="font-editorial font-semibold text-4xl text-white leading-none mt-1">
                                                {item.city}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                                        <dl className="space-y-3 text-base text-slate-700 font-sans">
                                            <div className="flex flex-col gap-0.5 border-b border-[#B3D6E6]/70 pb-3">
                                                <dt className="text-sm text-slate-600">Main waterway</dt>
                                                <dd className="font-semibold text-slate-900">{item.river}</dd>
                                            </div>
                                            <div className="flex flex-col gap-0.5 border-b border-[#B3D6E6]/70 pb-3">
                                                <dt className="text-sm text-slate-600">Floods first at</dt>
                                                <dd className="text-slate-900">{item.focus}</dd>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <dt className="text-sm text-slate-600">Ground</dt>
                                                <dd className="text-slate-900">{item.elevation}</dd>
                                            </div>
                                        </dl>

                                        <div className="mt-6 pt-5 border-t border-[#B3D6E6] flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                            <span className="text-sm text-slate-700 whitespace-nowrap">
                                                {wardCount} {wardCount === 1 ? "ward" : "wards"} on the map
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-base font-bold text-sky-800 whitespace-nowrap">
                                                Open {item.city}
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                                            </span>
                                        </div>
                                    </div>
                                </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* What the estimate helps with                                              */}
                    {/* ========================================================================= */}
                    <section id="solutions" className="relative py-20 sm:py-28 w-full flex flex-col gap-10 sm:gap-12">
                        <div className="max-w-3xl border-b border-[#9DC6DA] pb-8 sm:pb-10">
                            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-900 tracking-[-0.01em] leading-[1.05]" style={{ textWrap: 'balance' }}>
                                What the estimate helps with
                            </h2>
                            <p className="text-slate-700 text-lg sm:text-xl mt-4 leading-relaxed font-sans" style={{ textWrap: 'pretty' }}>
                                Four everyday decisions during a heavy monsoon, and what RainDrop can and
                                cannot tell you about each.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-7">
                            <button
                                type="button"
                                onClick={onEnter}
                                className="group text-left rounded-2xl bg-white border border-[#9DC6DA] hover:border-sky-600 transition-[border-color,box-shadow,transform] duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 shadow-sm hover:shadow-lg"
                            >
                                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src="/static/images/hero-monsoon-bus-splash.webp"
                                        alt=""
                                        width="1600"
                                        height="1067"
                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                    />
                                    <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900">
                                        Commuting
                                    </span>
                                </div>
                                <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                                    <div>
                                        <h3 className="font-sans font-bold text-slate-900 text-xl" style={{ textWrap: 'balance' }}>
                                            Planning around flooded roads
                                        </h3>
                                        <p className="text-base text-slate-700 mt-3 leading-relaxed font-sans" style={{ textWrap: 'pretty' }}>
                                            See which wards are likely to flood over the next few hours, so commuters and transit crews can avoid the worst stretches. Routes are not planned for you.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#B3D6E6] pt-4">
                                        <span className="text-sm text-slate-600">Ward estimates, refreshed hourly</span>
                                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-800">
                                            Compare wards
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                                        </span>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => (onCheckRoute ? onCheckRoute("Chennai") : onOpenMap(null, "Chennai"))}
                                className="group text-left rounded-2xl bg-white border border-[#9DC6DA] hover:border-sky-600 transition-[border-color,box-shadow,transform] duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 shadow-sm hover:shadow-lg"
                            >
                                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src="/static/images/pexels-dibakar-roy-2432543-18192646.webp"
                                        alt=""
                                        width="1600"
                                        height="1067"
                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                    />
                                    <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900">
                                        Driving
                                    </span>
                                </div>
                                <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                                    <div>
                                        <h3 className="font-sans font-bold text-slate-900 text-xl" style={{ textWrap: 'balance' }}>
                                            Before you drive in
                                        </h3>
                                        <p className="text-base text-slate-700 mt-3 leading-relaxed font-sans" style={{ textWrap: 'pretty' }}>
                                            Enter the depth you can see and get a plain answer for a two-wheeler, a car or a bus. Moving water is more dangerous than any number suggests.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#B3D6E6] pt-4">
                                        <span className="text-sm text-slate-600">Advice per vehicle, not a guarantee</span>
                                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-800">
                                            Check a depth
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                                        </span>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onOpenMap(null, "Delhi")}
                                className="group text-left rounded-2xl bg-white border border-[#9DC6DA] hover:border-sky-600 transition-[border-color,box-shadow,transform] duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 shadow-sm hover:shadow-lg"
                            >
                                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src="/static/images/hero-river-ghats-aerial-hd.webp"
                                        alt=""
                                        width="1600"
                                        height="1067"
                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                    />
                                    <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900">
                                        Near a river
                                    </span>
                                </div>
                                <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                                    <div>
                                        <h3 className="font-sans font-bold text-slate-900 text-xl" style={{ textWrap: 'balance' }}>
                                            Living near a river
                                        </h3>
                                        <p className="text-base text-slate-700 mt-3 leading-relaxed font-sans" style={{ textWrap: 'pretty' }}>
                                            Shows how close each ward's river is to its danger level. The level is estimated from rainfall, because no river gauge is connected yet.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#B3D6E6] pt-4">
                                        <span className="text-sm text-slate-600">Estimated, not gauged</span>
                                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-800">
                                            Open Delhi
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                                        </span>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onOpenMap(null, "Chennai")}
                                className="group text-left rounded-2xl bg-white border border-[#9DC6DA] hover:border-sky-600 transition-[border-color,box-shadow,transform] duration-300 ease-out overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 shadow-sm hover:shadow-lg"
                            >
                                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
                                    <img
                                        loading="lazy"
                                        decoding="async"
                                        src="/static/images/pexels-dibakar-roy-2432543-19391751.webp"
                                        alt=""
                                        width="1600"
                                        height="1067"
                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                    />
                                    <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900">
                                        Control rooms
                                    </span>
                                </div>
                                <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                                    <div>
                                        <h3 className="font-sans font-bold text-slate-900 text-xl" style={{ textWrap: 'balance' }}>
                                            Deciding where to send pumps
                                        </h3>
                                        <p className="text-base text-slate-700 mt-3 leading-relaxed font-sans" style={{ textWrap: 'pretty' }}>
                                            Operators sign in to see which sectors are likely to pond first. Pump running status is not connected, so availability is confirmed with the ward office.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#B3D6E6] pt-4">
                                        <span className="text-sm text-slate-600">Operator sign-in required</span>
                                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-800">
                                            Open the control room
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                                        </span>
                                    </div>
                                </div>
                            </button>

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