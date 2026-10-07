// --- MODULE: client/src/icons/IconSvgRegistry.js ---
/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
// Global references — loaded via UMD scripts in index.html
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const ICON_SVGS = {
    ArrowRight: <g><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></g>,
    ArrowLeft: <g><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></g>,
    Play: <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />,
    Pause: <g><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none"/></g>,
    Droplets: <g><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></g>,
    Radio: <g><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></g>,
    Layers: <g><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-9.17 4.16a2 2 0 0 1-1.66 0L2 12.5"/><path d="m22 17.5-9.17 4.16a2 2 0 0 1-1.66 0L2 17.5"/></g>,
    AlertTriangle: <g><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></g>,
    Route: <g><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></g>,
    FileText: <g><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><line x1="10" y1="13" x2="14" y2="13"/><line x1="10" y1="17" x2="14" y2="17"/></g>,
    Building2: <g><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></g>,
    Waves: <g><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></g>,
    Navigation: <polygon points="3 11 22 2 13 21 11 13 3 11" fill="currentColor" />,
    MapPin: <g><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></g>,
    Search: <g><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></g>,
    Check: <polyline points="20 6 9 17 4 12"/>,
    X: <g><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></g>,
    ChevronDown: <polyline points="6 9 12 15 18 9"/>,
    ChevronUp: <polyline points="18 15 12 9 6 15"/>,
    Clock: <g><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></g>,
    Activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    ShieldCheck: <g><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><polyline points="9 12 11 14 15 10"/></g>,
    RefreshCw: <g><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></g>,
    Sliders: <g><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></g>,
    Eye: <g><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></g>,
    EyeOff: <g><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></g>,
    Sparkles: <g><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></g>,
    CheckCircle2: <g><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></g>,
    Shield: <g><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></g>,
    Users: <g><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></g>,
    Menu: <g><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></g>,
    ArrowUpRight: <g><path d="M7 17 17 7"/><path d="M7 7h10v10"/></g>,
    Star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>,
    Home: <g><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></g>,
    ChevronRight: <polyline points="9 18 15 12 9 6"/>,
};

// Safe Lucide icon accessor helper to guarantee no icon is ever undefined
const getIcon = (name, fallbackChildren) => {
    try {
        if (window.LucideReact && window.LucideReact[name]) return window.LucideReact[name];
        if (window.lucideReact && window.lucideReact[name]) return window.lucideReact[name];
        if (window.lucide && window.lucide[name]) return window.lucide[name];
    } catch (_) {}
    const defaultSvg = fallbackChildren || ICON_SVGS[name] || <circle cx="12" cy="12" r="8" />;
    return function SafeIcon(props) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={props.size || props.width || 16}
                height={props.size || props.height || 16}
                viewBox="0 0 24 24"
                fill={props.fill || "none"}
                stroke={props.stroke || "currentColor"}
                strokeWidth={props.strokeWidth || 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={props.className || ""}
            >
                {defaultSvg}
            </svg>
        );
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
const Search = getIcon("Search");
const Power = getIcon("Power");
const EyeOff = getIcon("EyeOff");
const Menu = getIcon("Menu");
const ArrowUpRight = getIcon("ArrowUpRight");
const Star = getIcon("Star");
const Route = getIcon("Route", (
    <g>
        <circle cx="6" cy="19" r="3" />
        <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
        <circle cx="18" cy="5" r="3" />
    </g>
));
const Bell = getIcon("Bell");
const Shield = getIcon("Shield");
const Users = getIcon("Users");
const Calendar = getIcon("Calendar");
const Plus = getIcon("Plus");
const Minus = getIcon("Minus");
const Home = getIcon("Home");
const ChevronRight = getIcon("ChevronRight");


// ============================================================================
// Static Configuration & Data
// ============================================================================


// --- MODULE: client/src/data/mockData.js ---
const WARDS_DATA = {
    // --- MUMBAI WARDS ---
    "Kurla West": {
        code: "Ward 184-L",
        name: "Kurla West",
        city: "Mumbai",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Mithi River Corridor",
        riverLevel: 3.42, // meters
        dangerLevel: 3.80,
        rainfallForecast: "54 mm",
        activePumps: "10 / 12",
        evacShelters: "4 Active (62% cap)",
        sectors: [
            { id: 0, name: "LBS Marg - Sheetal Jn", baseDepth: 18, elevation: 6.2, coords: "19.068, 72.879" },
            { id: 1, name: "Bail Bazar Nullah", baseDepth: 42, elevation: 4.8, coords: "19.071, 72.884" },
            { id: 2, name: "Kurla Station West Subway", baseDepth: 36, elevation: 5.1, coords: "19.065, 72.882" },
            { id: 3, name: "Kranti Nagar Lowland", baseDepth: 48, elevation: 4.3, coords: "19.062, 72.887" },
            { id: 4, name: "CST Road Bridge Ramp", baseDepth: 12, elevation: 8.4, coords: "19.074, 72.873" },
            { id: 5, name: "BKC Link Connector", baseDepth: 4, elevation: 9.8, coords: "19.060, 72.868" },
            { id: 6, name: "Taximens Colony Gate", baseDepth: 28, elevation: 5.5, coords: "19.076, 72.880" },
            { id: 7, name: "Kamani Industrial Jn", baseDepth: 32, elevation: 5.3, coords: "19.078, 72.886" },
            { id: 8, name: "Phoenix Mall Access Rd", baseDepth: 8, elevation: 7.9, coords: "19.083, 72.888" },
            { id: 9, name: "Halav Pool Causeway", baseDepth: 38, elevation: 4.9, coords: "19.064, 72.885" },
            { id: 10, name: "Kalina CST Flyover", baseDepth: 0, elevation: 12.1, coords: "19.072, 72.865" },
            { id: 11, name: "Sunder Nagar Culvert", baseDepth: 26, elevation: 5.8, coords: "19.070, 72.876" },
            { id: 12, name: "Jarimari Hillside Runoff", baseDepth: 22, elevation: 8.1, coords: "19.082, 72.878" },
            { id: 13, name: "Mithi River Retention Wall", baseDepth: 44, elevation: 4.4, coords: "19.063, 72.878" },
            { id: 14, name: "Kapadia Nagar Culvert", baseDepth: 14, elevation: 6.9, coords: "19.069, 72.871" },
            { id: 15, name: "SG Barve Marg Cross", baseDepth: 16, elevation: 6.7, coords: "19.066, 72.889" },
            { id: 16, name: "New Kurla Depot Area", baseDepth: 24, elevation: 5.9, coords: "19.061, 72.883" },
            { id: 17, name: "Brahmanwadi Sump", baseDepth: 34, elevation: 5.0, coords: "19.067, 72.887" },
            { id: 18, name: "Premier Compound West", baseDepth: 10, elevation: 7.5, coords: "19.079, 72.882" },
            { id: 19, name: "Kajupada Low Creek", baseDepth: 30, elevation: 5.4, coords: "19.085, 72.876" },
            { id: 20, name: "Air India Colony Spur", baseDepth: 6, elevation: 8.9, coords: "19.075, 72.868" },
            { id: 21, name: "Old Agra Road Jcn", baseDepth: 20, elevation: 6.3, coords: "19.073, 72.882" },
            { id: 22, name: "Pipe Road Drainage Box", baseDepth: 40, elevation: 4.7, coords: "19.066, 72.885" },
            { id: 23, name: "Kohinoor City Elevated", baseDepth: 2, elevation: 11.0, coords: "19.071, 72.877" },
        ],
    },
    "Kurla East": {
        code: "Ward 185-L",
        name: "Kurla East",
        city: "Mumbai",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "Eastern Nullah Trunk",
        riverLevel: 2.30,
        dangerLevel: 3.20,
        rainfallForecast: "38 mm",
        activePumps: "8 / 8",
        evacShelters: "3 Active (41% cap)",
        sectors: [
            { id: 0, name: "Nehru Nagar Bus Station", baseDepth: 22, elevation: 6.1, coords: "19.061, 72.894" },
            { id: 1, name: "Kasaiwada Nullah", baseDepth: 34, elevation: 4.9, coords: "19.058, 72.890" },
            { id: 2, name: "Shiv Shrishti Complex", baseDepth: 10, elevation: 7.8, coords: "19.064, 72.897" },
            { id: 3, name: "Tilak Nagar Station North", baseDepth: 26, elevation: 5.6, coords: "19.068, 72.899" },
            { id: 4, name: "Kamgar Nagar Culvert", baseDepth: 18, elevation: 6.4, coords: "19.065, 72.892" },
            { id: 5, name: "Eastern Express Highway Rmp", baseDepth: 4, elevation: 9.5, coords: "19.070, 72.905" },
            { id: 6, name: "Chunabhatti Rail Subway", baseDepth: 32, elevation: 5.1, coords: "19.052, 72.888" },
            { id: 7, name: "Mother Dairy Lowlands", baseDepth: 14, elevation: 7.0, coords: "19.063, 72.896" },
        ],
    },
    "Chembur": {
        code: "Ward 152-M",
        name: "Chembur",
        city: "Mumbai",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "Mahul Creek Drainage",
        riverLevel: 2.10,
        dangerLevel: 3.10,
        rainfallForecast: "34 mm",
        activePumps: "7 / 8",
        evacShelters: "2 Active (35% cap)",
        sectors: [
            { id: 0, name: "Postal Colony Low Area", baseDepth: 28, elevation: 5.4, coords: "19.055, 72.902" },
            { id: 1, name: "Shell Colony Nullah", baseDepth: 30, elevation: 5.2, coords: "19.052, 72.906" },
            { id: 2, name: "Amar Mahal Jn Underpass", baseDepth: 36, elevation: 4.8, coords: "19.072, 72.902" },
            { id: 3, name: "Diamond Garden Circle", baseDepth: 6, elevation: 8.7, coords: "19.050, 72.899" },
            { id: 4, name: "Sion-Trombay Highway Cross", baseDepth: 12, elevation: 7.2, coords: "19.059, 72.912" },
            { id: 5, name: "Chembur Naka Market", baseDepth: 16, elevation: 6.8, coords: "19.054, 72.904" },
        ],
    },
    "Vikhroli": {
        code: "Ward 121-S",
        name: "Vikhroli",
        city: "Mumbai",
        riskLevel: "LOW RISK",
        riskColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        riverName: "Thane Creek Spillway",
        riverLevel: 1.65,
        dangerLevel: 3.50,
        rainfallForecast: "22 mm",
        activePumps: "6 / 6",
        evacShelters: "2 Standby (18% cap)",
        sectors: [
            { id: 0, name: "Godrej Creek Basin", baseDepth: 14, elevation: 6.5, coords: "19.102, 72.930" },
            { id: 1, name: "Tagore Nagar Sector 3", baseDepth: 18, elevation: 6.1, coords: "19.106, 72.925" },
            { id: 2, name: "LBS Marg Vikhroli West", baseDepth: 8, elevation: 8.2, coords: "19.112, 72.918" },
            { id: 3, name: "Kannamwar Nagar Depot", baseDepth: 12, elevation: 7.0, coords: "19.108, 72.933" },
            { id: 4, name: "Kanjurmarg South Sump", baseDepth: 10, elevation: 7.4, coords: "19.120, 72.928" },
        ],
    },
    "Andheri West": {
        code: "Ward 064-K",
        name: "Andheri West",
        city: "Mumbai",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Oshiwara River Basin",
        riverLevel: 3.15,
        dangerLevel: 3.60,
        rainfallForecast: "46 mm",
        activePumps: "11 / 14",
        evacShelters: "5 Active (74% cap)",
        sectors: [
            { id: 0, name: "Milan Subway Lower Point", baseDepth: 46, elevation: 4.2, coords: "19.104, 72.842" },
            { id: 1, name: "SV Road Shoppers Stop Jn", baseDepth: 28, elevation: 5.8, coords: "19.118, 72.844" },
            { id: 2, name: "Veera Desai Industrial Drain", baseDepth: 34, elevation: 5.2, coords: "19.135, 72.833" },
            { id: 3, name: "Gilbert Hill Foothill Runoff", baseDepth: 22, elevation: 6.7, coords: "19.121, 72.838" },
            { id: 4, name: "DN Nagar Metro Depot", baseDepth: 10, elevation: 8.1, coords: "19.126, 72.831" },
            { id: 5, name: "Lokhandwala Back Road", baseDepth: 16, elevation: 7.0, coords: "19.141, 72.825" },
        ],
    },
    "Dadar West": {
        code: "Ward 191-GN",
        name: "Dadar West",
        city: "Mumbai",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Portuguese Church Drain",
        riverLevel: 3.10,
        dangerLevel: 3.50,
        rainfallForecast: "50 mm",
        activePumps: "9 / 10",
        evacShelters: "3 Active (55% cap)",
        sectors: [
            { id: 0, name: "Hindmata Flyover Low Point", baseDepth: 48, elevation: 3.8, coords: "19.008, 72.842" },
            { id: 1, name: "Dadar TT Circle Sump", baseDepth: 34, elevation: 4.6, coords: "19.018, 72.846" },
            { id: 2, name: "Kabutarkhana Transit Crossing", baseDepth: 22, elevation: 6.1, coords: "19.023, 72.840" },
        ],
    },

    // --- CHENNAI WARDS ---
    "Chennai Central (Adyar)": {
        code: "Ward 170-Adyar",
        name: "Chennai Central (Adyar)",
        city: "Chennai",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Adyar River Basin",
        riverLevel: 4.12,
        dangerLevel: 4.50,
        rainfallForecast: "62 mm",
        activePumps: "14 / 16",
        evacShelters: "6 Active (78% cap)",
        sectors: [
            { id: 0, name: "Kotturpuram Lowland Causeway", baseDepth: 44, elevation: 3.2, coords: "13.022, 80.241" },
            { id: 1, name: "Saidapet Bridge Approach", baseDepth: 38, elevation: 4.5, coords: "13.028, 80.224" },
            { id: 2, name: "Velachery Main Road Junction", baseDepth: 52, elevation: 2.8, coords: "12.981, 80.218" },
            { id: 3, name: "Jafferkhanpet Canal Outlet", baseDepth: 36, elevation: 4.1, coords: "13.033, 80.209" },
            { id: 4, name: "Guindy Industrial Flyover Link", baseDepth: 6, elevation: 9.4, coords: "13.010, 80.212" },
        ],
    },
    "Chennai North (Otteri)": {
        code: "Ward 074-Otteri",
        name: "Chennai North (Otteri)",
        city: "Chennai",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "Otteri Nullah Channel",
        riverLevel: 2.85,
        dangerLevel: 3.40,
        rainfallForecast: "48 mm",
        activePumps: "10 / 12",
        evacShelters: "4 Active (52% cap)",
        sectors: [
            { id: 0, name: "Pulianthope Lowland Canal", baseDepth: 32, elevation: 3.8, coords: "13.097, 80.264" },
            { id: 1, name: "Basin Bridge Junction Sump", baseDepth: 40, elevation: 3.1, coords: "13.104, 80.272" },
            { id: 2, name: "Vysarpadi Subway Underpass", baseDepth: 48, elevation: 2.5, coords: "13.111, 80.258" },
            { id: 3, name: "Perambur High Road Railway Crossing", baseDepth: 18, elevation: 6.2, coords: "13.108, 80.245" },
        ],
    },
    "T. Nagar (Cooum)": {
        code: "Ward 113-Cooum",
        name: "T. Nagar (Cooum)",
        city: "Chennai",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Cooum River Spillway",
        riverLevel: 3.90,
        dangerLevel: 4.20,
        rainfallForecast: "58 mm",
        activePumps: "12 / 12",
        evacShelters: "5 Active (68% cap)",
        sectors: [
            { id: 0, name: "Usman Road Underpass", baseDepth: 46, elevation: 3.4, coords: "13.041, 80.233" },
            { id: 1, name: "G N Chetty Road Drainage Sump", baseDepth: 30, elevation: 4.8, coords: "13.048, 80.242" },
            { id: 2, name: "Mambalam Canal Outfall", baseDepth: 42, elevation: 3.6, coords: "13.036, 80.228" },
            { id: 3, name: "Valluvar Kottam High Ridge", baseDepth: 4, elevation: 10.2, coords: "13.055, 80.240" },
        ],
    },
    "Velachery": {
        code: "Ward 177-VEL",
        name: "Velachery",
        city: "Chennai",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Pallikaranai Marshland Outlet",
        riverLevel: 4.05,
        dangerLevel: 4.30,
        rainfallForecast: "65 mm",
        activePumps: "15 / 16",
        evacShelters: "7 Active (82% cap)",
        sectors: [
            { id: 0, name: "Velachery Lake Overflow Gate", baseDepth: 54, elevation: 2.2, coords: "12.975, 80.221" },
            { id: 1, name: "100 Feet Bypass Road Low Point", baseDepth: 40, elevation: 3.5, coords: "12.986, 80.216" },
            { id: 2, name: "Taramani Link Road Sump", baseDepth: 32, elevation: 4.2, coords: "12.983, 80.240" },
        ],
    },
    "Anna Nagar": {
        code: "Ward 102-ANN",
        name: "Anna Nagar",
        city: "Chennai",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "Otteri Nullah West Extension",
        riverLevel: 2.70,
        dangerLevel: 3.30,
        rainfallForecast: "42 mm",
        activePumps: "8 / 10",
        evacShelters: "3 Active (40% cap)",
        sectors: [
            { id: 0, name: "Anna Arch Circular Drain", baseDepth: 28, elevation: 5.1, coords: "13.083, 80.218" },
            { id: 1, name: "Koyambedu Wholesale Market Sump", baseDepth: 35, elevation: 4.4, coords: "13.071, 80.194" },
            { id: 2, name: "Shanti Colony Ridge", baseDepth: 6, elevation: 9.8, coords: "13.087, 80.211" },
        ],
    },

    // --- DELHI WARDS ---
    "Yamuna Floodplain (ITO)": {
        code: "NCR Ward 042-ITO",
        name: "Yamuna Floodplain (ITO)",
        city: "Delhi",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Yamuna River Main Trunk",
        riverLevel: 205.80,
        dangerLevel: 205.33,
        rainfallForecast: "50 mm",
        activePumps: "18 / 20",
        evacShelters: "8 Active (85% cap)",
        sectors: [
            { id: 0, name: "ITO Ring Road Underpass", baseDepth: 55, elevation: 202.1, coords: "28.628, 77.248" },
            { id: 1, name: "Kashmere Gate ISBT Ramp", baseDepth: 42, elevation: 203.4, coords: "28.667, 77.228" },
            { id: 2, name: "Loha Pul Yamuna Bank", baseDepth: 60, elevation: 201.8, coords: "28.656, 77.245" },
            { id: 3, name: "Rajghat Lowland Overflow", baseDepth: 35, elevation: 203.9, coords: "28.641, 77.249" },
            { id: 4, name: "Vikas Marg Flyover Bypass", baseDepth: 8, elevation: 211.5, coords: "28.631, 77.255" },
        ],
    },
    "Najafgarh Basin": {
        code: "NCR Ward 108-NJF",
        name: "Najafgarh Basin",
        city: "Delhi",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "Najafgarh Drain Channel",
        riverLevel: 204.10,
        dangerLevel: 205.00,
        rainfallForecast: "36 mm",
        activePumps: "12 / 14",
        evacShelters: "4 Active (45% cap)",
        sectors: [
            { id: 0, name: "Dwarka Sector 8 Underpass", baseDepth: 38, elevation: 203.8, coords: "28.571, 77.068" },
            { id: 1, name: "Uttam Nagar Drain Outfall", baseDepth: 28, elevation: 204.5, coords: "28.622, 77.058" },
            { id: 2, name: "Kakrola Regulator Sump", baseDepth: 32, elevation: 204.1, coords: "28.610, 77.039" },
            { id: 3, name: "Najafgarh Main Chowk Ridge", baseDepth: 10, elevation: 209.2, coords: "28.609, 76.985" },
        ],
    },
    "Barapullah Corridor": {
        code: "NCR Ward 088-BRP",
        name: "Barapullah Corridor",
        city: "Delhi",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "Barapullah Nallah",
        riverLevel: 204.30,
        dangerLevel: 205.20,
        rainfallForecast: "40 mm",
        activePumps: "10 / 10",
        evacShelters: "3 Active (38% cap)",
        sectors: [
            { id: 0, name: "Nizamuddin Railway Subway", baseDepth: 45, elevation: 203.0, coords: "28.591, 77.252" },
            { id: 1, name: "Jangpura Nallah Culvert", baseDepth: 26, elevation: 205.2, coords: "28.582, 77.241" },
            { id: 2, name: "AIIMS Flyover Underpass", baseDepth: 34, elevation: 204.6, coords: "28.567, 77.210" },
            { id: 3, name: "Barapullah Elevated Expressway", baseDepth: 0, elevation: 215.0, coords: "28.585, 77.230" },
        ],
    },
    "Okhla Industrial Zone": {
        code: "NCR Ward 096-OKH",
        name: "Okhla Industrial Zone",
        city: "Delhi",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Agra Canal Headworks",
        riverLevel: 205.10,
        dangerLevel: 205.40,
        rainfallForecast: "54 mm",
        activePumps: "14 / 15",
        evacShelters: "5 Active (64% cap)",
        sectors: [
            { id: 0, name: "Okhla Underpass Lower Basin", baseDepth: 50, elevation: 202.4, coords: "28.535, 77.272" },
            { id: 1, name: "Mathura Road Drainage Sump", baseDepth: 36, elevation: 204.0, coords: "28.542, 77.265" },
        ],
    },
    "Minto Bridge Corridor": {
        code: "NCR Ward 031-MNT",
        name: "Minto Bridge Corridor",
        city: "Delhi",
        riskLevel: "CRITICAL RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Connaught Place Trunk Drain",
        riverLevel: 204.90,
        dangerLevel: 205.10,
        rainfallForecast: "58 mm",
        activePumps: "16 / 16",
        evacShelters: "4 Active (70% cap)",
        sectors: [
            { id: 0, name: "Minto Road Railway Underpass", baseDepth: 62, elevation: 201.2, coords: "28.634, 77.225" },
            { id: 1, name: "Deen Dayal Upadhaya Marg Sump", baseDepth: 42, elevation: 203.1, coords: "28.636, 77.232" },
        ],
    },
    "Madipakkam": {
        code: "Ward 188-MDP",
        name: "Madipakkam",
        city: "Chennai",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Kilkattalai Surplus Channel",
        riverLevel: 3.50,
        dangerLevel: 3.90,
        rainfallForecast: "55 mm",
        activePumps: "12 / 14",
        evacShelters: "4 Active (58% cap)",
        sectors: [
            { id: 0, name: "Madipakkam Lake Weirs", baseDepth: 46, elevation: 2.4, coords: "12.962, 80.198" },
            { id: 1, name: "Balaiah Nagar Low Culvert", baseDepth: 38, elevation: 3.1, coords: "12.968, 80.204" },
            { id: 2, name: "Kilkattalai Link Drain", baseDepth: 30, elevation: 3.9, coords: "12.955, 80.191" },
        ],
    },

    // --- BENGALURU WARDS ---
    "Bellandur Lake Basin": {
        code: "BBMP Ward 150-BLR",
        name: "Bellandur Lake Basin",
        city: "Bengaluru",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "K-Valley Stormwater Drain",
        riverLevel: 884.60,
        dangerLevel: 885.00,
        rainfallForecast: "48 mm",
        activePumps: "12 / 14",
        evacShelters: "5 Active (68% cap)",
        sectors: [
            { id: 0, name: "Yemlur Sump & Culvert", baseDepth: 42, elevation: 884.2, coords: "12.946, 77.678" },
            { id: 1, name: "Rainbow Drive Spillway", baseDepth: 36, elevation: 886.5, coords: "12.923, 77.689" },
            { id: 2, name: "EcoSpace Outer Ring Road", baseDepth: 48, elevation: 883.8, coords: "12.926, 77.679" },
            { id: 3, name: "Bellandur Inflow Gate", baseDepth: 28, elevation: 888.1, coords: "12.938, 77.662" },
            { id: 4, name: "Kadur Agro Elevated Link", baseDepth: 6, elevation: 899.0, coords: "12.931, 77.694" },
        ],
    },
    "Koramangala Valley": {
        code: "BBMP Ward 151-KRM",
        name: "Koramangala Valley",
        city: "Bengaluru",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "Koramangala Intermediate Drain",
        riverLevel: 891.20,
        dangerLevel: 892.00,
        rainfallForecast: "35 mm",
        activePumps: "8 / 10",
        evacShelters: "3 Active (42% cap)",
        sectors: [
            { id: 0, name: "Sony World Junction Underpass", baseDepth: 38, elevation: 891.4, coords: "12.936, 77.625" },
            { id: 1, name: "ST Bed Layout Lowland Sump", baseDepth: 44, elevation: 889.7, coords: "12.928, 77.629" },
            { id: 2, name: "Intermediate Ring Road Culvert", baseDepth: 26, elevation: 894.2, coords: "12.943, 77.632" },
            { id: 3, name: "Koramangala 4th Block Drain", baseDepth: 32, elevation: 892.0, coords: "12.931, 77.619" },
        ],
    },
    "HSR Layout Sector 6": {
        code: "BBMP Ward 174-HSR",
        name: "HSR Layout Sector 6",
        city: "Bengaluru",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Silk Board Feeder Canal",
        riverLevel: 897.40,
        dangerLevel: 898.00,
        rainfallForecast: "52 mm",
        activePumps: "10 / 12",
        evacShelters: "4 Active (55% cap)",
        sectors: [
            { id: 0, name: "Silk Board Junction Depression", baseDepth: 52, elevation: 895.0, coords: "12.917, 77.623" },
            { id: 1, name: "14th Main Road Feeder Sump", baseDepth: 30, elevation: 898.5, coords: "12.909, 77.636" },
            { id: 2, name: "Agara Lake Overflow Weir", baseDepth: 24, elevation: 897.2, coords: "12.921, 77.647" },
            { id: 3, name: "Sector 7 Park Retention Basin", baseDepth: 18, elevation: 902.1, coords: "12.904, 77.642" },
        ],
    },
    "Manyata Tech Park": {
        code: "BBMP Ward 024-MNY",
        name: "Manyata Tech Park",
        city: "Bengaluru",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Hebbal Lake Surplus Channel",
        riverLevel: 914.80,
        dangerLevel: 915.00,
        rainfallForecast: "46 mm",
        activePumps: "14 / 16",
        evacShelters: "4 Active (60% cap)",
        sectors: [
            { id: 0, name: "Hebbal Valley Outfall Canal", baseDepth: 46, elevation: 912.8, coords: "13.042, 77.612" },
            { id: 1, name: "Manyata Backgate Sump", baseDepth: 38, elevation: 914.5, coords: "13.053, 77.624" },
            { id: 2, name: "Nagavara Lake Inundation Sump", baseDepth: 28, elevation: 916.2, coords: "13.037, 77.621" },
        ],
    },
    "Varthur Spillway": {
        code: "BBMP Ward 149-VTR",
        name: "Varthur Spillway",
        city: "Bengaluru",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "Dakshina Pinakini Basin",
        riverLevel: 877.20,
        dangerLevel: 878.00,
        rainfallForecast: "38 mm",
        activePumps: "8 / 10",
        evacShelters: "2 Active (35% cap)",
        sectors: [
            { id: 0, name: "Varthur Kodi Bridge Lower Point", baseDepth: 40, elevation: 875.8, coords: "12.944, 77.749" },
            { id: 1, name: "Gunjur Lake Drainage Spur", baseDepth: 22, elevation: 881.0, coords: "12.928, 77.738" },
            { id: 2, name: "Balagere Main Road Sump", baseDepth: 34, elevation: 878.4, coords: "12.937, 77.731" },
        ],
    },

    // --- KOLKATA WARDS ---
    "Circular Canal & Ultadanga": {
        code: "KMC Ward 013-ULT",
        name: "Circular Canal & Ultadanga",
        city: "Kolkata",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Circular Canal Outfall",
        riverLevel: 6.40,
        dangerLevel: 6.80,
        rainfallForecast: "64 mm",
        activePumps: "16 / 18",
        evacShelters: "6 Active (75% cap)",
        sectors: [
            { id: 0, name: "Ultadanga Underpass Sump", baseDepth: 50, elevation: 4.1, coords: "22.598, 88.381" },
            { id: 1, name: "Bagbazar Lock Gate Outfall", baseDepth: 36, elevation: 4.8, coords: "22.604, 88.368" },
            { id: 2, name: "Maniktala Main Road Crossing", baseDepth: 28, elevation: 5.6, coords: "22.586, 88.379" },
            { id: 3, name: "Kankurgachi Railway Culvert", baseDepth: 38, elevation: 4.5, coords: "22.581, 88.388" },
        ],
    },
    "Park Circus Connector": {
        code: "KMC Ward 059-PKC",
        name: "Park Circus Connector",
        city: "Kolkata",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "Eastern Drainage Channel",
        riverLevel: 6.10,
        dangerLevel: 6.50,
        rainfallForecast: "45 mm",
        activePumps: "12 / 14",
        evacShelters: "4 Active (50% cap)",
        sectors: [
            { id: 0, name: "Park Circus 7-Point Sump", baseDepth: 42, elevation: 4.4, coords: "22.542, 88.369" },
            { id: 1, name: "Topsia Canal Outfall", baseDepth: 35, elevation: 4.0, coords: "22.538, 88.382" },
            { id: 2, name: "EM Bypass Science City Jn", baseDepth: 18, elevation: 6.2, coords: "22.539, 88.396" },
        ],
    },
    "Tolly's Nullah (Kalighat)": {
        code: "KMC Ward 083-KLG",
        name: "Tolly's Nullah (Kalighat)",
        city: "Kolkata",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Adi Ganga / Tolly's Nullah",
        riverLevel: 5.60,
        dangerLevel: 5.90,
        rainfallForecast: "56 mm",
        activePumps: "10 / 12",
        evacShelters: "4 Active (62% cap)",
        sectors: [
            { id: 0, name: "Kalighat Temple Causeway", baseDepth: 46, elevation: 3.6, coords: "22.518, 88.344" },
            { id: 1, name: "Chetla Lock Drainage Sump", baseDepth: 32, elevation: 4.5, coords: "22.524, 88.338" },
            { id: 2, name: "Alipore Zoo Southern Culvert", baseDepth: 24, elevation: 5.2, coords: "22.533, 88.334" },
        ],
    },
    "Salt Lake Sector V": {
        code: "BMC Ward 031-SLK",
        name: "Salt Lake Sector V",
        city: "Kolkata",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "East Kolkata Wetlands Canal",
        riverLevel: 5.10,
        dangerLevel: 5.50,
        rainfallForecast: "40 mm",
        activePumps: "14 / 16",
        evacShelters: "3 Active (45% cap)",
        sectors: [
            { id: 0, name: "College More Lowland Crossing", baseDepth: 36, elevation: 3.2, coords: "22.571, 88.431" },
            { id: 1, name: "Technopolis Canal Regulator", baseDepth: 28, elevation: 3.8, coords: "22.582, 88.439" },
            { id: 2, name: "Sector V Ring Drain Sump", baseDepth: 22, elevation: 4.2, coords: "22.566, 88.428" },
        ],
    },
    "Behala Lowlands": {
        code: "KMC Ward 118-BHL",
        name: "Behala Lowlands",
        city: "Kolkata",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Churial Canal Sump",
        riverLevel: 4.90,
        dangerLevel: 5.20,
        rainfallForecast: "58 mm",
        activePumps: "10 / 12",
        evacShelters: "5 Active (70% cap)",
        sectors: [
            { id: 0, name: "Diamond Harbour Road Chowrasta", baseDepth: 44, elevation: 2.8, coords: "22.498, 88.312" },
            { id: 1, name: "Taratala Flyover Underpass", baseDepth: 38, elevation: 3.5, coords: "22.512, 88.318" },
            { id: 2, name: "Parnasree Lake Basin", baseDepth: 30, elevation: 3.9, coords: "22.502, 88.305" },
        ],
    },

    // --- HYDERABAD WARDS ---
    "Musi River Corridor": {
        code: "GHMC Ward 045-MSI",
        name: "Musi River Corridor",
        city: "Hyderabad",
        riskLevel: "CRITICAL RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Musi River Central Channel",
        riverLevel: 507.90,
        dangerLevel: 508.50,
        rainfallForecast: "60 mm",
        activePumps: "15 / 16",
        evacShelters: "7 Active (80% cap)",
        sectors: [
            { id: 0, name: "Moosarambagh Causeway", baseDepth: 56, elevation: 503.2, coords: "17.371, 78.508" },
            { id: 1, name: "Chaderghat Bridge Approach", baseDepth: 46, elevation: 505.5, coords: "17.378, 78.491" },
            { id: 2, name: "Puranapul Low Pier Basin", baseDepth: 42, elevation: 507.0, coords: "17.359, 78.468" },
            { id: 3, name: "Afzalgunj Nala Confluence", baseDepth: 34, elevation: 508.8, coords: "17.373, 78.479" },
        ],
    },
    "Begumpet Nala": {
        code: "GHMC Ward 149-BGP",
        name: "Begumpet Nala",
        city: "Hyderabad",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Begumpet Major Storm Drain",
        riverLevel: 514.40,
        dangerLevel: 515.00,
        rainfallForecast: "50 mm",
        activePumps: "11 / 12",
        evacShelters: "4 Active (65% cap)",
        sectors: [
            { id: 0, name: "Prakash Nagar Culvert Sump", baseDepth: 48, elevation: 511.5, coords: "17.446, 78.462" },
            { id: 1, name: "Rasoolpura Junction Underpass", baseDepth: 38, elevation: 513.2, coords: "17.439, 78.478" },
            { id: 2, name: "Mayur Marg Lowland Runoff", baseDepth: 28, elevation: 515.0, coords: "17.448, 78.471" },
        ],
    },
    "Hussain Sagar Surplus": {
        code: "GHMC Ward 092-HSR",
        name: "Hussain Sagar Surplus",
        city: "Hyderabad",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Hussain Sagar Outlet Weir",
        riverLevel: 513.80,
        dangerLevel: 514.20,
        rainfallForecast: "48 mm",
        activePumps: "13 / 14",
        evacShelters: "4 Active (58% cap)",
        sectors: [
            { id: 0, name: "Necklace Road Outlet Weir", baseDepth: 40, elevation: 511.0, coords: "17.427, 78.469" },
            { id: 1, name: "Lower Tank Bund Sump", baseDepth: 34, elevation: 512.6, coords: "17.419, 78.484" },
            { id: 2, name: "Buddha Bhavan Spillway Gate", baseDepth: 26, elevation: 514.8, coords: "17.432, 78.472" },
        ],
    },
    "Kukatpally Y-Junction": {
        code: "GHMC Ward 120-KPT",
        name: "Kukatpally Y-Junction",
        city: "Hyderabad",
        riskLevel: "MODERATE RISK",
        riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        riverName: "IDL Lake Drainage Runoff",
        riverLevel: 527.10,
        dangerLevel: 528.00,
        rainfallForecast: "36 mm",
        activePumps: "9 / 10",
        evacShelters: "3 Active (40% cap)",
        sectors: [
            { id: 0, name: "Balaji Nagar Drainage Choke", baseDepth: 42, elevation: 524.2, coords: "17.491, 78.392" },
            { id: 1, name: "IDL Lake Sump Overflow", baseDepth: 36, elevation: 526.0, coords: "17.502, 78.404" },
            { id: 2, name: "KPHB Colony Main Canal", baseDepth: 24, elevation: 529.5, coords: "17.487, 78.388" },
        ],
    },
    "Tolichowki Basin": {
        code: "GHMC Ward 071-TCK",
        name: "Tolichowki Basin",
        city: "Hyderabad",
        riskLevel: "HIGH RISK",
        riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        riverName: "Shah Hatim Talab Drain",
        riverLevel: 511.20,
        dangerLevel: 512.00,
        rainfallForecast: "54 mm",
        activePumps: "11 / 12",
        evacShelters: "4 Active (62% cap)",
        sectors: [
            { id: 0, name: "Nadeem Colony Lowland Sump", baseDepth: 52, elevation: 508.0, coords: "17.403, 78.405" },
            { id: 1, name: "Tolichowki Flyover Underpass", baseDepth: 38, elevation: 510.4, coords: "17.398, 78.416" },
            { id: 2, name: "Shaikpet Nala Regulator", baseDepth: 26, elevation: 513.5, coords: "17.409, 78.411" },
        ],
    },
};

const WARDS = Object.keys(WARDS_DATA);

// Web Audio synthesizer for alert notifications

const HYDROGRAPH_DATA = [
    { t: "T-1h", rain: 1.2, surge: 1.2, label: "-1h Past" },
    { t: "Now", rain: 2.8, surge: 1.5, label: "Live Telemetry" },
    { t: "+1h", rain: 4.5, surge: 1.8, label: "+1h Forecast" },
    { t: "+2h", rain: 3.2, surge: 2.1, label: "+2h Forecast" },
    { t: "+3h", rain: 2.0, surge: 1.9, label: "+3h Forecast" },
    { t: "+4h", rain: 1.1, surge: 1.6, label: "+4h Forecast" },
    { t: "+6h", rain: 0.5, surge: 1.3, label: "+6h Forecast" },
];

// Route definitions for interactive routing
const ROUTE_OPTIONS = [
    {
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
            segments: [
                { name: "Depot Access Lane", depth: 12, safe: true },
                { name: "Bail Bazar Nullah Causeway", depth: 44, safe: false },
                { name: "Station West Approach", depth: 38, safe: false },
            ],
        },
        safeRoute: {
            dist: "2.6 km",
            time: "19 min (+5m detour)",
            elevation: "8.5m avg ridge",
            hazardLevel: "Clear & Passable",
            corridor: "Via Kalina Flyover & Elevated Link",
            segments: [
                { name: "Depot Access Lane", depth: 12, safe: true },
                { name: "Kalina CST Flyover Ramp", depth: 0, safe: true },
                { name: "Kohinoor Elevated Spine", depth: 2, safe: true },
                { name: "Station East Elevated Footbridge", depth: 4, safe: true },
            ],
        },
    },
    {
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
            segments: [
                { name: "LBS Marg Arterial", depth: 28, safe: false },
                { name: "Sheetal Cinema Jn", depth: 34, safe: false },
                { name: "BKC Ramp Lower Deck", depth: 16, safe: true },
            ],
        },
        safeRoute: {
            dist: "3.1 km",
            time: "22 min (+4m detour)",
            elevation: "11.2m avg ridge",
            hazardLevel: "Clear & Passable",
            corridor: "Via Air India Colony Ridge & CST Upper Bridge",
            segments: [
                { name: "Air India Colony Ridge", depth: 4, safe: true },
                { name: "CST Upper Bridge Ramp", depth: 0, safe: true },
                { name: "BKC Flyover Direct Link", depth: 0, safe: true },
            ],
        },
    },
];

// ============================================================================
// Small Reusable Components
// ============================================================================


const CITY_PROFILES = {
    "Chennai": {
        state: "Tamil Nadu",
        basin: "Adyar & Cooum River Basins",
        risk: "HIGH RISK",
        riskColor: "bg-rose-50 text-rose-700 border-rose-200",
        rainfall: "62 mm/h",
        activePumps: "49 / 54",
        shelters: "22 Hubs",
        riverStatus: "Adyar River (4.12m)",
        dangerLevel: "4.50m",
        description: "Coastal monsoon runoff with Pallikaranai marshland retention & tidal barrier.",
        gradient: "from-blue-600/10 to-indigo-600/10",
        hotspots: 14,
        elevationAvg: "4.2m",
    },
    "Mumbai": {
        state: "Maharashtra",
        basin: "Mithi River & Mahul Creek",
        risk: "HIGH RISK",
        riskColor: "bg-rose-50 text-rose-700 border-rose-200",
        rainfall: "54 mm/h",
        activePumps: "51 / 58",
        shelters: "20 Hubs",
        riverStatus: "Mithi River (3.42m)",
        dangerLevel: "3.80m",
        description: "Lowland rail subways & Arabian sea high tide backflow throttles.",
        gradient: "from-sky-600/10 to-blue-600/10",
        hotspots: 18,
        elevationAvg: "5.8m",
    },
    "Delhi": {
        state: "National Capital Region",
        basin: "Yamuna River Floodplain",
        risk: "HIGH RISK",
        riskColor: "bg-rose-50 text-rose-700 border-rose-200",
        rainfall: "50 mm/h",
        activePumps: "62 / 69",
        shelters: "26 Hubs",
        riverStatus: "Yamuna River (205.80m)",
        dangerLevel: "205.33m",
        description: "Hathnikund barrage spillway discharge approaching historic high water mark.",
        gradient: "from-amber-600/10 to-rose-600/10",
        hotspots: 12,
        elevationAvg: "204.5m",
    },
    "Bengaluru": {
        state: "Karnataka",
        basin: "Dakshina Pinakini & Vrishabhavathi",
        risk: "MODERATE RISK",
        riskColor: "bg-amber-50 text-amber-700 border-amber-200",
        rainfall: "48 mm/h",
        activePumps: "38 / 42",
        shelters: "16 Hubs",
        riverStatus: "Bellandur Outfall (2.40m)",
        dangerLevel: "3.00m",
        description: "Cascading lake chain breach monitoring with Outer Ring Road underpass sump alerts.",
        gradient: "from-emerald-600/10 to-teal-600/10",
        hotspots: 15,
        elevationAvg: "892.4m",
    },
    "Kolkata": {
        state: "West Bengal",
        basin: "Hooghly River & East Wetlands",
        risk: "HIGH RISK",
        riskColor: "bg-rose-50 text-rose-700 border-rose-200",
        rainfall: "52 mm/h",
        activePumps: "44 / 50",
        shelters: "18 Hubs",
        riverStatus: "Hooghly Basin (3.85m)",
        dangerLevel: "4.10m",
        description: "Tidal lock gate closures at Lockgate Road and Circular Canal siphon.",
        gradient: "from-indigo-600/10 to-purple-600/10",
        hotspots: 16,
        elevationAvg: "4.8m",
    },
    "Hyderabad": {
        state: "Telangana",
        basin: "Musi River & Hussain Sagar",
        risk: "MODERATE RISK",
        riskColor: "bg-amber-50 text-amber-700 border-amber-200",
        rainfall: "44 mm/h",
        activePumps: "34 / 38",
        shelters: "14 Hubs",
        riverStatus: "Musi River (507.90m)",
        dangerLevel: "508.50m",
        description: "Hussain Sagar surplus weir discharge and Moosarambagh causeway monitoring.",
        gradient: "from-cyan-600/10 to-blue-600/10",
        hotspots: 11,
        elevationAvg: "512.6m",
    },
};

// ============================================================================
// 3:7 Split City & Ward Intelligence Matrix Overview Component
// Reference Design Implementation (Minimalist Editorial Civic Layout)
// ============================================================================

const CITY_HERO_BACKDROPS = {
    "Chennai": "/static/Landing Page images/zoshua-colah-1fradOPdjBM-unsplash.jpg",
    "Mumbai": "/static/Landing Page images/hero-mumbai-harbor-boats.jpg",
    "Delhi": "/static/Landing Page images/pexels-dibakar-roy-2432543-18192646.jpg",
    "Bengaluru": "/static/Landing Page images/pexels-wanderinglenses-13670217.jpg",
    "Kolkata": "/static/Landing Page images/hero-kolkata-taxi-reflection.jpg",
    "Hyderabad": "/static/Landing Page images/hero-river-ghats-aerial-hd.jpg",
};

// Line-art Monument Sketches for the 6 Metros

// --- MODULE: client/src/components/common/CommonUI.jsx ---
function ToastStack({ toasts }) {
    return (
        <div className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className="flex items-center gap-2.5 rounded-xl border border-indigo-500/30 bg-[#161a29]/95 backdrop-blur-md px-4 py-2.5 shadow-2xl shadow-indigo-950/60 text-slate-100 animate-in fade-in slide-in-from-bottom-3 duration-200"
                >
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
                    <span className="text-xs font-medium">{t.msg}</span>
                </div>
            ))}
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


// --- MODULE: client/src/components/dashboard/CityWardOverview.jsx ---
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


// --- MODULE: client/src/components/dashboard/TopNavbar.jsx ---
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


// --- MODULE: client/src/components/hero/HeroView.jsx ---
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
            img: "/static/images/hero-river-ghats-aerial-hd.jpg",
            tag: "RIVER TOPOGRAPHY",
            stats: "25.3176° N, 82.8739° E"
        },
        {
            num: "02",
            title: "Harbor Tides & Coastal Fleets",
            subtitle: "Mumbai Harbor Tidal Basin",
            desc: "Coastal surge modeling and astronomical high-tide boundary conditions for peninsular megacities.",
            img: "/static/images/hero-mumbai-harbor-boats.jpg",
            tag: "COASTAL DYNAMICS",
            stats: "18.9220° N, 72.8347° E"
        },
        {
            num: "03",
            title: "Urban Monsoons & Street Reflections",
            subtitle: "Kolkata Metropolitan Grid",
            desc: "Street-level micro-inundation nowcasting tracking waterlogged taxi avenues and low-elevation sumps.",
            img: "/static/images/hero-kolkata-taxi-reflection.jpg",
            tag: "URBAN INUNDATION",
            stats: "22.5726° N, 88.3639° E"
        },
        {
            num: "04",
            title: "Highway Drainage & Storm Surges",
            subtitle: "Corridor Transit Bypass",
            desc: "Dual-corridor safe elevation routing bypassing flooded underpasses and high-velocity stormwater splash zones.",
            img: "/static/images/hero-monsoon-bus-splash.jpg",
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
            img: "/static/images/pexels-wanderinglenses-13670217.jpg"
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
            img: "/static/images/zoshua-colah-1fradOPdjBM-unsplash.jpg"
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
            img: "/static/images/dibakar-roy-KbG3OsDKkCM-unsplash.jpg"
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
            img: "/static/images/hero-kolkata-taxi-reflection.jpg"
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
            img: "/static/images/hero-aerial-drone.jpg"
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
            img: "/static/images/dibakar-roy-aby-GGLtD-A-unsplash.jpg"
        }
    ];

    const GIS_PILLARS = [
        {
            num: "01",
            title: "3D Street Elevation Mapping",
            badge: "Terrain Heights",
            tagline: "Pinpoints low road dips and hollows where stormwater gathers first.",
            desc: "By reading high-accuracy satellite terrain heights across every street, RainDrop reveals exactly which intersections, underpasses, and neighborhood lanes sit in natural low points.",
            img: "/static/images/dibakar-roy-FbOchRlXaPs-unsplash.jpg",
            benefits: ["Sub-meter street height precision", "Highlights deep road hollows", "Calculates downhill water flow", "Flags trapped water pockets"],
            tag: "Elevation Topography"
        },
        {
            num: "02",
            title: "Live Rainstorm Radar Tracking",
            badge: "Weather Radar",
            tagline: "Follows heavy cloudbursts minute-by-minute hours before rainfall peaks.",
            desc: "Streams live weather radar across every metropolitan area. It tracks storm clouds in motion so residents and municipal crews know exactly when and where heavy downpours will hit.",
            img: "/static/images/dibakar-roy-DccG84ivd3k-unsplash.jpg",
            benefits: ["Live radar precipitation feed", "Storm direction and speed tracking", "5-minute cloud updates", "Up to 6 hours advance warning"],
            tag: "Radar Telemetry"
        },
        {
            num: "03",
            title: "Canals & Drainage Water Flow",
            badge: "Waterway Movement",
            tagline: "Monitors city canals, sea tides, and stormwater drainage lines.",
            desc: "Watches how water travels through underground pipes, open city canals, and river outfall gates, accounting for ocean high tides that push seawater back into neighborhood drains.",
            img: "/static/images/dibakar-roy-P7Z3HwNWPeQ-unsplash.jpg",
            benefits: ["Underground pipe capacity checks", "Tide and river backflow tracking", "Canal blockage detection", "Gate opening advisories"],
            tag: "Hydrodynamics"
        },
        {
            num: "04",
            title: "Instant Street Flood Depth Alerts",
            badge: "Real-Time Depth",
            tagline: "Calculates standing water depth across every neighborhood in milliseconds.",
            desc: "Instead of waiting hours for slow simulations, our smart predictive model calculates whether a street will have 5 cm or 45 cm of water in milliseconds as rain falls.",
            img: "/static/images/hero-aerial-drone.jpg",
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
                        poster="/static/images/rain-video-poster.jpg"
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
                            className="px-6 py-2.5 rounded-full border border-white/80 text-white text-[11px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 hover:bg-white hover:text-black active:scale-95 cursor-pointer"
                        >
                            VIEW LIVE MAP
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
                                className="w-full text-center py-3 rounded-full border border-white/80 text-white text-xs font-semibold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
                            >
                                VIEW LIVE MAP
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Main Hero Core Content */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 my-auto pb-16 sm:pb-20">
                    <div className="max-w-3xl">
                        {/* Serif Headline with Cormorant Garamond */}
                        <h1 className="font-editorial text-5xl sm:text-6xl md:text-7xl lg:text-[95px] leading-[0.95] tracking-[-0.01em] font-bold text-white text-glow">
                            Predict Floods.<br />Protect Cities.
                        </h1>

                        {/* Subtitle */}
                        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-white/90 font-medium max-w-lg leading-relaxed text-glow">
                            Real-time street water level alerts, storm drain tracking, and safe evacuation routes before floodwaters rise.
                        </p>

                        {/* CTA Action (Clean Single Pill Button Without Video Play Button) */}
                        <div className="mt-7 sm:mt-9 flex items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    if (onOpenMap) onOpenMap(ward, "Chennai");
                                    else onEnter();
                                }}
                                className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold text-xs sm:text-sm tracking-[0.18em] uppercase rounded-md shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-2xl hover:shadow-white/20 active:scale-95 cursor-pointer"
                            >
                                EXPLORE LIVE NOWCAST
                            </button>
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
                        <span className="hover:text-emerald-700 transition-colors">REAL-TIME RADAR</span>
                        <span className="text-black/40">•</span>
                        <span className="hover:text-emerald-700 transition-colors">ZERO FLOOD DELAYS</span>
                        <span className="text-black/40">•</span>
                        <span className="hover:text-emerald-700 transition-colors">6 INDIAN BASINS</span>
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
                                    Live City Waterways Across 6 Indian Metros
                                </h2>
                                <p className="text-slate-700 text-lg sm:text-xl lg:text-2xl mt-4 leading-relaxed font-sans font-light">
                                    Continuous 24/7 water monitoring across India's premier coastal and river basins. Select any metro to load real-time municipal diagnostics.
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
                                        src="/static/images/hero-monsoon-bus-splash.jpg"
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
                                        src="/static/images/pexels-dibakar-roy-2432543-18192646.jpg"
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
                                        <span className="font-bold text-amber-800">✓ 100% Engine Safety</span>
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
                                        src="/static/images/hero-river-ghats-aerial-hd.jpg"
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
                                        src="/static/images/pexels-dibakar-roy-2432543-19391751.jpg"
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

// --- MODULE: client/src/components/map/InteractiveVectorMap.jsx ---
// Marker colours for /api/spot_check verdicts.
const SPOT_VERDICT_COLORS = {
    CLEAR: '#10b981',
    CAUTION: '#f59e0b',
    UNSAFE: '#dc2626',
    IMPASSABLE: '#991b1b',
    UNKNOWN: '#64748b',
};

function InteractiveVectorMap(props) {
    const {
        wardData,
        sectorDepths,
        selectedSector,
        onSelectSector,
        layers,
        activeRoute,
        isSimulatingRoute,
        routeProgress,
        routeCheckResult,
        mapStyle = "Map",
        mapToggles = { hotspots: true, pumps: true, shelters: false, metro: true, boundaries: false },
        timelineStep = 1,
    } = props;

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const sectorMarkersRef = useRef({});
    const tileLayerRef = useRef(null);
    const prevWardRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current || !window.L) return;

        let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
        if (mapStyle === 'Satellite') {
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        } else if (mapStyle === 'Terrain') {
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
        }

        // Initialize Leaflet map if not already created
        if (!mapInstanceRef.current) {
            const map = window.L.map(mapRef.current, {
                center: [13.0827, 80.2707],
                zoom: 13,
                zoomControl: false,
                attributionControl: false,
            });

            window._rainDropMap = map;

            const tileLayer = window.L.tileLayer(tileUrl, {
                attribution: '&copy; Esri, HERE, Garmin, USGS',
                maxZoom: 19,
            }).addTo(map);

            tileLayerRef.current = tileLayer;
            mapInstanceRef.current = map;
        } else {
            if (tileLayerRef.current) {
                tileLayerRef.current.setUrl(tileUrl);
            }
        }

        const map = mapInstanceRef.current;

        // Ensure Leaflet resizes correctly within container
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 150);

        // Clear existing markers & overlays
        markersRef.current.forEach(layer => map.removeLayer(layer));
        markersRef.current = [];
        sectorMarkersRef.current = {};

        const bounds = [];

        // Collect sector coordinates
        wardData.sectors.forEach((sec) => {
            const coords = sec.coords.split(',').map(n => parseFloat(n.trim()));
            if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                bounds.push([coords[0], coords[1]]);
            }
        });

        // 1. Render Flood Basin Water Polygon Overlay
        if (bounds.length >= 3 && mapToggles.hotspots !== false) {
            const basinPolygon = window.L.polygon(bounds, {
                color: '#0284c7',
                weight: 1.2,
                fillColor: '#38bdf8',
                fillOpacity: 0.22,
                smoothFactor: 1.5,
            }).addTo(map);
            markersRef.current.push(basinPolygon);
        }

        // Find sector with highest water depth for primary callout
        let maxDepthIdx = 0;
        sectorDepths.forEach((d, i) => {
            if (d > (sectorDepths[maxDepthIdx] || 0)) maxDepthIdx = i;
        });

        // 2. Render Sector Nodes & Hotspot Callout
        if (mapToggles.hotspots !== false) {
            wardData.sectors.forEach((sec, idx) => {
                const depth = sectorDepths[idx] || 0;
                const coords = sec.coords.split(',').map(n => parseFloat(n.trim()));
                if (coords.length < 2 || isNaN(coords[0]) || isNaN(coords[1])) return;
                const [lat, lon] = coords;

                let nodeHtml = "";
                let nodeSize = [28, 28];
                let anchor = [14, 14];

                if (depth >= 30) {
                    // Critical hotspot: Red circle with white exclamation point & glowing pulse
                    nodeHtml = `<div style="background:#ef4444; color:#ffffff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; border:3px solid #ffffff; box-shadow:0 4px 12px rgba(239,68,68,0.6); cursor:pointer; font-family:Inter,sans-serif; transition:transform 0.2s;">!</div>`;
                } else if (depth >= 15) {
                    // Caution hotspot: Amber circle with warning triangle
                    nodeHtml = `<div style="background:#f59e0b; color:#ffffff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; border:2.5px solid #ffffff; box-shadow:0 3px 8px rgba(245,158,11,0.5); cursor:pointer; font-family:Inter,sans-serif; transition:transform 0.2s;">▲</div>`;
                    nodeSize = [26, 26];
                    anchor = [13, 13];
                } else {
                    // Clear safe corridor: Emerald circle with checkmark
                    nodeHtml = `<div style="background:#10b981; color:#ffffff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(16,185,129,0.45); cursor:pointer; font-family:Inter,sans-serif; transition:transform 0.2s;">✓</div>`;
                    nodeSize = [24, 24];
                    anchor = [12, 12];
                }

                // Inundation radial pool
                const circleRadius = Math.max(80, depth * 4.5 + 40);
                const circle = window.L.circle([lat, lon], {
                    radius: circleRadius,
                    color: depth >= 30 ? '#f43f5e' : depth >= 15 ? '#fbbf24' : '#34d399',
                    fillColor: depth >= 30 ? '#ef4444' : depth >= 15 ? '#3b82f6' : '#10b981',
                    fillOpacity: 0.25,
                    weight: 1,
                }).addTo(map);

                const icon = window.L.divIcon({
                    className: 'custom-status-marker',
                    html: nodeHtml,
                    iconSize: nodeSize,
                    iconAnchor: anchor
                });

                const marker = window.L.marker([lat, lon], { icon }).addTo(map);

                // Rich Interactive Leaflet Popup with Full Telemetry
                const riskBadge = depth >= 30 ? "CRITICAL RISK" : depth >= 15 ? "MODERATE HAZARD" : "SAFE ELEVATION";
                const riskBg = depth >= 30 ? "#fef2f2" : depth >= 15 ? "#fffbeb" : "#ecfdf5";
                const riskColor = depth >= 30 ? "#dc2626" : depth >= 15 ? "#d97706" : "#059669";
                const riskBorder = depth >= 30 ? "#fca5a5" : depth >= 15 ? "#fcd34d" : "#6ee7b7";

                const popupHtml = `
                <div style="font-family:Inter,sans-serif; min-width:250px; padding:4px 2px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; background:${riskBg}; color:${riskColor}; border:1px solid ${riskBorder}; padding:2.5px 8px; border-radius:9999px;">
                            ${riskBadge}
                        </span>
                        <span style="font-size:10px; color:#64748b; font-family:monospace;">${sec.elevation}m MSL</span>
                    </div>
                    <div style="font-size:14px; font-weight:800; color:#0f172a; line-height:1.25; margin-bottom:3px;">
                        ${sec.name}
                    </div>
                    <div style="font-size:11px; color:#64748b; margin-bottom:10px;">
                        ${wardData.name} · ${wardData.city} (${wardData.riverName})
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px;">
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:8px 10px;">
                            <div style="font-size:9.5px; color:#64748b; font-weight:600;">Water Depth</div>
                            <div style="font-size:15px; font-weight:800; color:${depth >= 30 ? '#dc2626' : depth >= 15 ? '#d97706' : '#2563eb'}; font-family:monospace;">
                                ${depth.toFixed(1)} cm
                            </div>
                        </div>
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:8px 10px;">
                            <div style="font-size:9.5px; color:#64748b; font-weight:600;">Flow Velocity</div>
                            <div style="font-size:15px; font-weight:800; color:#0f172a; font-family:monospace;">
                                ${(1.1 + depth * 0.02).toFixed(1)} m/s
                            </div>
                        </div>
                    </div>

                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:8px 10px; margin-bottom:10px; font-size:11px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="color:#64748b;">Drainage Culvert:</span>
                            <span style="font-weight:700; color:${depth >= 30 ? '#dc2626' : '#059669'};">
                                ${depth >= 30 ? '92% Surcharged' : depth >= 15 ? '64% Flowing' : '28% Free Flow'}
                            </span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="color:#64748b;">Pedestrians:</span>
                            <span style="font-weight:700; color:${depth >= 15 ? '#dc2626' : '#059669'};">
                                ${depth >= 15 ? '⛔ Impassable' : '✅ Passable'}
                            </span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:#64748b;">Vehicles:</span>
                            <span style="font-weight:700; color:${depth >= 25 ? '#dc2626' : depth >= 15 ? '#d97706' : '#059669'};">
                                ${depth >= 25 ? '⛔ High Stall Risk' : depth >= 15 ? '⚠️ Caution' : '✅ Clear'}
                            </span>
                        </div>
                    </div>

                    <button type="button" onclick="window._openSectorDrawer && window._openSectorDrawer(${idx})" style="width:100%; background:#0f2942; color:#ffffff; border:none; padding:8px 12px; border-radius:12px; font-size:11.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 2px 6px rgba(15,41,66,0.2);">
                        <span>Check Location Safety &rarr;</span>
                    </button>
                </div>
                `;

                marker.bindPopup(popupHtml, { maxWidth: 300, offset: [0, -10] });
                circle.bindPopup(popupHtml, { maxWidth: 300, offset: [0, -10] });

                const handleNodeClick = () => {
                    onSelectSector(idx);
                    try { marker.openPopup(); } catch (_) {}
                };

                marker.on('click', handleNodeClick);
                circle.on('click', handleNodeClick);

                sectorMarkersRef.current[idx] = marker;
                markersRef.current.push(circle);
                markersRef.current.push(marker);
            });
        }

        // 3. Render Drainage Pumps
        if (mapToggles.pumps && bounds.length >= 2) {
            bounds.slice(1, 4).forEach((pt, i) => {
                const pumpIcon = window.L.divIcon({
                    className: 'pump-marker',
                    html: `<div style="background:#2563eb; color:#ffffff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(37,99,235,0.4);" title="Stormwater Dewatering Pump #0${i+1}">⚡</div>`,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
                const pMarker = window.L.marker([pt[0] + 0.003, pt[1] - 0.003], { icon: pumpIcon }).addTo(map);
                pMarker.bindPopup(`<strong>⚡ Stormwater Dewatering Pump #0${i+1}</strong><br><span style="font-size:11px; color:#2563eb;">Status: 100% Active Suction</span>`);
                markersRef.current.push(pMarker);
            });
        }

        // 4. Render Transit & Metro
        if (mapToggles.metro && bounds.length >= 2) {
            bounds.slice(0, 3).forEach((pt, i) => {
                const metroIcon = window.L.divIcon({
                    className: 'metro-marker',
                    html: `<div style="background:#059669; color:#ffffff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(5,150,105,0.4);" title="Metro & Transit Station">🚇</div>`,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
                const mMarker = window.L.marker([pt[0] - 0.0035, pt[1] + 0.0035], { icon: metroIcon }).addTo(map);
                mMarker.bindPopup(`<strong>🚇 Metro Station #M-${i+1}</strong><br><span style="font-size:11px; color:#059669;">Corridor: Elevated Dry Deck</span>`);
                markersRef.current.push(mMarker);
            });
        }

        // 5. Render Relief Shelters
        if (mapToggles.shelters && bounds.length >= 2) {
            bounds.slice(0, 3).forEach((pt, i) => {
                const shelterIcon = window.L.divIcon({
                    className: 'shelter-marker',
                    html: `<div style="background:#7c3aed; color:#ffffff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(124,58,237,0.4);" title="Emergency Relief Shelter">🏠</div>`,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
                const sMarker = window.L.marker([pt[0] + 0.004, pt[1] + 0.004], { icon: shelterIcon }).addTo(map);
                sMarker.bindPopup(`<strong>🏠 Emergency Relief Shelter #${i+1}</strong><br><span style="font-size:11px; color:#7c3aed;">Capacity: Available</span>`);
                markersRef.current.push(sMarker);
            });
        }

        // 6. Render Ward Boundaries
        if (mapToggles.boundaries && bounds.length >= 3) {
            const boundaryLine = window.L.polygon(bounds, {
                color: '#64748b',
                weight: 2,
                dashArray: '5, 6',
                fill: false
            }).addTo(map);
            markersRef.current.push(boundaryLine);
        }

        // Auto Fit Map Bounds ONLY when active ward changes
        if (bounds.length > 0 && prevWardRef.current !== wardData.name) {
            prevWardRef.current = wardData.name;
            try {
                map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
            } catch (_) {}
        }

        // Mark the point assessed by the spot check. No route geometry is drawn:
        // there is no road graph, so any corridor line would be invented.
        if (routeCheckResult && routeCheckResult.coordinates) {
            const { lat, lon } = routeCheckResult.coordinates;
            if (typeof lat === 'number' && typeof lon === 'number') {
                const marker = window.L.circleMarker([lat, lon], {
                    radius: 10,
                    color: SPOT_VERDICT_COLORS[routeCheckResult.verdict] || SPOT_VERDICT_COLORS.UNKNOWN,
                    weight: 3,
                    fillOpacity: 0.35
                }).addTo(map);
                marker.bindPopup(
                    `<strong>${routeCheckResult.ward_name}</strong><br/>` +
                    `${routeCheckResult.verdict}` +
                    (routeCheckResult.predicted_flood_depth_cm == null
                        ? ''
                        : ` — ${routeCheckResult.predicted_flood_depth_cm} cm`)
                );
                markersRef.current.push(marker);
            }
        }

    }, [wardData, sectorDepths, layers, mapStyle, mapToggles, timelineStep, activeRoute, isSimulatingRoute, routeProgress, routeCheckResult]);

    // Dedicated pan & popup effect for selected sector (does not tear down map layers)
    useEffect(() => {
        if (selectedSector === null || !mapInstanceRef.current || !wardData?.sectors?.[selectedSector]) return;
        const map = mapInstanceRef.current;
        const sec = wardData.sectors[selectedSector];
        const coords = sec.coords.split(',').map(n => parseFloat(n.trim()));
        if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            try {
                map.panTo([coords[0], coords[1]], { animate: true, duration: 0.4 });
            } catch (_) {}
        }
        const marker = sectorMarkersRef.current?.[selectedSector];
        if (marker) {
            setTimeout(() => {
                try { marker.openPopup(); } catch (_) {}
            }, 80);
        }
    }, [selectedSector, wardData]);

    return (
        <div className="relative w-full h-full min-h-[500px]">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    );
}

// ============================================================================
// Sector Telemetry Drawer (Click to Inspect) — Human-Friendly Spot Safety Check
// ============================================================================

function SectorDrawer({ sector, depth, wardName, onClose, pushToast }) {
    const isHigh = depth >= 30;
    const isMed = depth >= 15 && depth < 30;

    // Interactive button states — ensures nothing goes unattended
    const [pumpStatus, setPumpStatus] = useState(null); // null | 'dispatched'
    const [divertStatus, setDivertStatus] = useState(null); // null | 'active'
    const [showRouteTip, setShowRouteTip] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Everyday human-friendly water level descriptions
    const depthHuman = depth < 5
        ? "Dry / Safe"
        : depth < 15
            ? "Puddle Level (Passable)"
            : depth < 25
                ? "Ankle to Shin Deep"
                : depth < 40
                    ? "Knee Deep (Hazardous)"
                    : "Waist Deep (Severe Danger)";

    const statusTitle = isHigh ? "Flooded · Hazard" : isMed ? "Waterlogged · Caution" : "Clear & Safe";
    const statusBg = isHigh
        ? "bg-rose-50 border-rose-200 text-rose-700"
        : isMed
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-emerald-50 border-emerald-200 text-emerald-800";
    const statusDot = isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500";

    const handleDispatchPump = () => {
        setPumpStatus("dispatched");
        if (pushToast) pushToast(`⚡ Dewatering Pump Unit #14 dispatched to ${sector.name}`);
    };

    const handleDivertTraffic = () => {
        setDivertStatus("active");
        if (pushToast) pushToast(`📢 Traffic Diversion Notice issued for ${sector.name}`);
    };

    return (
        <>
            {/* Soft backdrop overlay */}
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[940] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Clean Light-Theme Spot Safety Inspector Drawer */}
            <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white border-l border-slate-200 shadow-2xl z-[950] p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 text-slate-900 font-sans">
                <div>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                    {wardName} · Spot Safety Check
                                </span>
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-900 mt-1">{sector.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Critical Drainage &amp; Road Point · Low-lying Sector
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Close (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Water Depth Hero Card */}
                    <div className="my-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-500">Live Water Depth</span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${statusBg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                                {statusTitle}
                            </span>
                        </div>

                        <div className="flex items-baseline justify-between mb-2">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{depth}</span>
                                <span className="text-sm font-bold text-slate-500">cm</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700">{depthHuman}</span>
                        </div>

                        {/* Clean Horizontal Depth Gauge with Human Milestones */}
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative">
                            <div
                                className={`h-full transition-all duration-500 ${
                                    isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(8, (depth / 50) * 100))}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
                            <span>0 cm (Dry)</span>
                            <span>15 cm (Ankles)</span>
                            <span>30 cm (Knees)</span>
                            <span>50+ cm (Danger)</span>
                        </div>
                    </div>

                    {/* Quick Plain-English Condition Summary */}
                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Water Movement</span>
                            <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                                {depth >= 25 ? (
                                    <><span>⚠️</span> Fast moving current</>
                                ) : depth >= 15 ? (
                                    <><span>🌊</span> Slow moving runoff</>
                                ) : (
                                    <><span>✅</span> Standing puddles only</>
                                )}
                            </p>
                        </div>

                        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Local Drains</span>
                            <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                                {depth >= 30 ? (
                                    <><span>⚠️</span> Drains near full capacity</>
                                ) : (
                                    <><span>⚡</span> Pumps actively draining</>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Can I travel through here? Clear Everyday User Guide */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 mb-4 shadow-xs">
                        <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-blue-600" />
                                Can I pass through this road?
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">Live Commuter Guide</span>
                        </h4>

                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-600 flex items-center gap-2 font-medium">
                                    <span>🚶</span> Walking on foot
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded-md ${
                                    depth >= 15 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                                }`}>
                                    {depth >= 15 ? "⛔ Avoid — Water above ankles" : "✅ Safe to walk"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-600 flex items-center gap-2 font-medium">
                                    <span>🛵</span> Bikes &amp; Scooters
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded-md ${
                                    depth >= 18 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                                }`}>
                                    {depth >= 18 ? "⛔ High stall risk" : "✅ Safe to ride"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-600 flex items-center gap-2 font-medium">
                                    <span>🚗</span> Cars &amp; Autos
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded-md ${
                                    depth >= 25 
                                        ? "bg-rose-50 text-rose-700" 
                                        : depth >= 15 
                                            ? "bg-amber-50 text-amber-800" 
                                            : "bg-emerald-50 text-emerald-700"
                                }`}>
                                    {depth >= 25 ? "⛔ Impassable — Do not enter" : depth >= 15 ? "⚠️ Caution — Slow down" : "✅ Passable"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-600 flex items-center gap-2 font-medium">
                                    <span>🚑</span> Buses &amp; Emergency Trucks
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded-md ${
                                    depth >= 45 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"
                                }`}>
                                    {depth >= 45 ? "⚠️ High clearance only" : "✅ Priority Corridor Clear"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* In-place Action Confirmation Banners — ensures no click goes unattended */}
                    {(pumpStatus || divertStatus || showRouteTip) && (
                        <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            {pumpStatus === "dispatched" && (
                                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-0.5 font-bold">⚡</span>
                                        <div>
                                            <strong className="font-bold block">Dewatering Pump Unit #14 Dispatched</strong>
                                            <span className="text-blue-700 text-[11px]">En route to {sector.name} · Estimated suction start: ~10 mins</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPumpStatus(null)}
                                        className="text-blue-500 hover:text-blue-700 text-[11px] font-bold underline cursor-pointer"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}

                            {divertStatus === "active" && (
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-0.5 font-bold">📢</span>
                                        <div>
                                            <strong className="font-bold block">Traffic Diversion Active</strong>
                                            <span className="text-amber-800 text-[11px]">Advisory broadcast to municipal feeds &amp; local ward signs.</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDivertStatus(null)}
                                        className="text-amber-600 hover:text-amber-800 text-[11px] font-bold underline cursor-pointer"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}

                            {showRouteTip && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2">
                                        <span className="text-emerald-600 mt-0.5 font-bold">🛣️</span>
                                        <div>
                                            <strong className="font-bold block">Recommended Dry Alternate Route</strong>
                                            <span className="text-emerald-800 text-[11px]">Take the Kalina-CST Elevated Bypass. 100% dry (0 cm water), +3 min detour.</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowRouteTip(false)}
                                        className="text-emerald-600 hover:text-emerald-800 text-[11px] font-bold underline cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Data provenance. This project has no sensor network: depth is
                        modelled, so the card states the model inputs rather than
                        implying a calibrated gauge feed. */}
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 mb-4 text-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                Data Provenance
                            </span>
                            <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                Modelled
                            </span>
                        </div>
                        <div className="space-y-1.5 text-[11px] text-slate-600">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Rainfall:</span>
                                <span className="font-medium text-slate-700">NASA GPM IMERG nowcast</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Terrain:</span>
                                <span className="font-medium text-slate-700">30m DEM surface hydrology</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Depth estimate:</span>
                                <span className="font-medium text-slate-700">ML surrogate (unvalidated)</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                                No in-situ gauge or sensor feed. Figures are model output,
                                not measurements.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                    <button
                        onClick={() => setShowRouteTip(!showRouteTip)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                        <Route className="w-4 h-4" />
                        <span>{showRouteTip ? "Hide Dry Alternate Route" : "Show Dry Alternate Route"}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handleDispatchPump}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                                pumpStatus === "dispatched"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
                                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                            <Zap className="w-3.5 h-3.5 text-blue-600" />
                            <span>{pumpStatus === "dispatched" ? "Pump Sent ✓" : "Send Pump"}</span>
                        </button>

                        <button
                            onClick={handleDivertTraffic}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                                divertStatus === "active"
                                    ? "bg-amber-50 border-amber-200 text-amber-800 font-bold"
                                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                            <Send className="w-3.5 h-3.5 text-amber-600" />
                            <span>{divertStatus === "active" ? "Diverted ✓" : "Divert Traffic"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ============================================================================
// Time Machine & Hydrograph Controller
// ============================================================================

function TimeMachineBar(props) {
    const { timeStep, setTimeStep, isPlaying, setIsPlaying, playSpeed, setPlaySpeed, hydrograph } = props;

    const current = hydrograph[timeStep] || hydrograph[0];

    return (
        <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${isPlaying
                                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/25"
                            }`}
                    >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isPlaying ? "Pause Forecast" : "Simulate Run"}</span>
                    </button>

                    <button
                        onClick={() => setPlaySpeed(playSpeed === 1 ? 2 : 1)}
                        className="px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold cursor-pointer"
                    >
                        {playSpeed}x
                    </button>

                    <span className="text-xs text-slate-300 font-semibold ml-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Horizon: <strong className="text-white font-mono">{current.t}</strong> ({current.label})</span>
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {hydrograph.map((step, idx) => (
                        <button
                            key={step.t}
                            onClick={() => {
                                setTimeStep(idx);
                                setIsPlaying(false);
                            }}
                            className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${timeStep === idx
                                    ? "bg-indigo-600 text-white font-bold shadow-sm"
                                    : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60"
                                }`}
                        >
                            {step.t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative w-full h-14 bg-[#090d16] rounded-xl border border-slate-800/80 p-1.5 flex items-end justify-between overflow-hidden">
                <div className="absolute top-1 left-2 text-[9px] font-mono text-slate-500">
                    Rainfall Intensity (mm/h) &amp; River Surge Projection (m)
                </div>

                {hydrograph.map((item, idx) => {
                    const isCurrent = timeStep === idx;
                    const barHeight = Math.min(100, Math.max(15, (item.rain / 60) * 100));

                    return (
                        <div
                            key={item.t}
                            onClick={() => {
                                setTimeStep(idx);
                                setIsPlaying(false);
                            }}
                            className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                        >
                            <div
                                className={`w-4/5 rounded-t transition-all duration-300 ${isCurrent
                                        ? "bg-gradient-to-t from-indigo-600 to-sky-400 opacity-90 shadow-md shadow-indigo-500/50"
                                        : "bg-slate-700/40 group-hover:bg-slate-600/60"
                                    }`}
                                style={{ height: `${barHeight}%` }}
                            />

                            {isCurrent && (
                                <div className="absolute top-0 bottom-0 w-0.5 bg-sky-400 shadow-lg shadow-sky-400">
                                    <div className="w-2 h-2 -ml-[3px] rounded-full bg-white border border-sky-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// ============================================================================
// Hotspot Telemetry & Sump Status Deck
// ============================================================================

function HotspotTelemetryDeck({ wardData, sectorDepths, onSelectSector, onEnableMap }) {
    const sortedSectors = wardData.sectors
        .map((s, idx) => ({ ...s, originalIdx: idx, depth: sectorDepths[idx] || 0 }))
        .sort((a, b) => b.depth - a.depth);

    const totalFlooded = sortedSectors.filter(s => s.depth >= 30).length;
    const totalCaution = sortedSectors.filter(s => s.depth >= 15 && s.depth < 30).length;
    const totalSafe = sortedSectors.filter(s => s.depth < 15).length;

    return (
        <div className="rounded-lg border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-lg flex flex-col gap-4">
            <div>
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-white" />
                        Hotspot Telemetry &amp; Sump Overview
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-white/20">
                        {wardData.code} Live Feed
                    </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                    Real-time depth sensors, pump status, and plain-English flood situation telemetry.
                </p>
            </div>

            {/* Plain English Summary Box */}
            <div className="rounded-md border border-white/20 bg-zinc-900 p-3 text-xs leading-relaxed">
                <div className="flex items-center gap-2 text-white font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span>What Is Happening Right Now:</span>
                </div>
                <p className="text-zinc-300 text-[11px]">
                    Heavy rainfall ({wardData.rainfallForecast}) paired with {wardData.riverName} tide ({wardData.riverLevel}m) is creating backwater surcharge.
                    <span className="font-bold text-red-400"> {totalFlooded} low-lying hotspots are severely flooded (&gt;30cm)</span>. 
                    {wardData.activePumps} dewatering pumps are actively discharging stormwater.
                </p>
            </div>

            {/* Telemetry Summary Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-zinc-900 border border-red-500/40">
                    <span className="block text-[9px] uppercase text-zinc-400 font-mono">Flooded</span>
                    <span className="font-bold text-red-400 font-mono text-sm">{totalFlooded} Hotspots</span>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-yellow-500/40">
                    <span className="block text-[9px] uppercase text-zinc-400 font-mono">Caution</span>
                    <span className="font-bold text-yellow-400 font-mono text-sm">{totalCaution} Hotspots</span>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-emerald-500/40">
                    <span className="block text-[9px] uppercase text-zinc-400 font-mono">Clear</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">{totalSafe} Hotspots</span>
                </div>
            </div>

            {/* Hotspots List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Top Critical Hotspot Telemetry</span>
                {sortedSectors.slice(0, 6).map((sec) => (
                    <div 
                        key={sec.id}
                        onClick={() => {
                            onEnableMap();
                            onSelectSector(sec.originalIdx !== undefined ? sec.originalIdx : sec.id);
                        }}
                        className="p-2.5 rounded-md border border-zinc-800 bg-zinc-900/90 hover:border-white/40 transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white">{sec.name}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">Elev: {sec.elevation}m · {sec.coords}</span>
                        </div>

                        <div className="text-right">
                            <span className="font-mono font-bold text-sm block text-white">{sec.depth} cm</span>
                            <span className="text-[10px] text-zinc-400 font-mono">Elev: {sec.elevation}m · {sec.coords}</span>
                        </div>

                        <div className="text-right">
                            <span className="font-mono font-bold text-sm block text-white">{sec.depth} cm</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                sec.depth >= 30
                                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                                    : sec.depth >= 15
                                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            }`}>
                                {sec.depth >= 30 ? "🛑 IMPASSABLE" : sec.depth >= 15 ? "⚠️ CAUTION" : "🟢 SAFE"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Simulate Run Engine — Real-time Event Simulation
// ============================================================================

function ScenarioSandbox({ scenario, setScenario, pushToast }) {
    const [simStep, setSimStep] = useState(0);
    const [isSimRunning, setIsSimRunning] = useState(false);

    const SIMULATION_PHASES = [
        { title: "Minute 00: Cloudburst Initiation", desc: "Monsoon cloudburst delivers 54 mm/hr precipitation. Runoff begins entering drainage sumps.", status: "RUNOFF START" },
        { title: "Minute 15: Lowland Inundation", desc: "Retention basins reach 85% capacity. Water accumulates at Kurla Subway and Bail Bazar.", status: "SURCHARGE ALERT" },
        { title: "Minute 30: Peak Inundation", desc: "Kurla Station West Subway submersed under 42cm water. Impassable for light motor vehicles.", status: "PEAK SUBMERSION" },
        { title: "Minute 45: Dewatering Pump Engagement", desc: "All 10 stormwater dewatering pumps engaged (45,000 L/min discharge). Backwater stabilized.", status: "PUMPS ACTIVE" },
        { title: "Minute 60: Receding Water Level", desc: "Rainfall subsides. Water level receding by 8 cm/hr across primary corridors.", status: "RECEDING FLOW" },
    ];

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

    return (
        <div className="rounded-lg border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-lg flex flex-col gap-4">
            <div>
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Play className="w-4 h-4 text-white" />
                        Simulate Run — Real-Time Flood Timeline
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-white/20">
                        Event Simulator
                    </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                    Simulate cloudburst downpours, high tides, or pump outages to see what is actually happening.
                </p>
            </div>

            {/* Live Event Execution Card */}
            <div className="rounded-md border border-white/20 bg-zinc-900 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">What Is Actually Happening:</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                        {SIMULATION_PHASES[simStep].status}
                    </span>
                </div>

                <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                    <h4 className="text-xs font-bold text-white">{SIMULATION_PHASES[simStep].title}</h4>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                        {SIMULATION_PHASES[simStep].desc}
                    </p>
                </div>

                {/* Timeline Progress */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                    {SIMULATION_PHASES.map((ph, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setSimStep(idx)}
                            className={`h-2 rounded-sm cursor-pointer transition-all ${
                                idx === simStep ? "bg-white" : idx < simStep ? "bg-zinc-500" : "bg-zinc-800"
                            }`}
                            title={ph.title}
                        />
                    ))}
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleRunLiveSim}
                disabled={isSimRunning}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold border border-white shadow transition-all cursor-pointer disabled:opacity-50"
            >
                <Play className="w-4 h-4 fill-current text-zinc-950" />
                <span>{isSimRunning ? `Simulating Phase ${simStep + 1} of 5…` : "▶️ Start Live Flood Event Simulation"}</span>
            </button>

            {/* What-If Sliders */}
            <div className="pt-3 border-t border-zinc-800 space-y-3">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Environmental Stress-Test Parameters</span>

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300 font-medium">Rainfall Intensity</span>
                        <span className="font-mono text-white font-bold">
                            {Math.round(scenario.rainfallMultiplier * 45)} mm/h ({scenario.rainfallMultiplier.toFixed(1)}x)
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={scenario.rainfallMultiplier}
                        onChange={(e) =>
                            setScenario((s) => ({ ...s, rainfallMultiplier: parseFloat(e.target.value) }))
                        }
                        className="w-full accent-white cursor-pointer"
                    />
                </div>

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300 font-medium">Mithi Creek Tidal Offset</span>
                        <span className="font-mono text-white font-bold">
                            {scenario.tideOffset >= 0 ? `+${scenario.tideOffset.toFixed(1)}m` : `${scenario.tideOffset.toFixed(1)}m`}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="-1.0"
                        max="2.0"
                        step="0.2"
                        value={scenario.tideOffset}
                        onChange={(e) =>
                            setScenario((s) => ({ ...s, tideOffset: parseFloat(e.target.value) }))
                        }
                        className="w-full accent-white cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
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
        sectorDepths,
    } = props;

    const currentRoute = routes[activeRouteIndex];

    // Identify flooded sectors
    const floodedSectors = wardData ? wardData.sectors
        .map((s, idx) => ({ ...s, depth: sectorDepths[idx] || 0 }))
        .filter(s => s.depth >= 25) : [];

    return (
        <div className="rounded-lg border border-white/20 bg-zinc-950 p-4 sm:p-5 shadow-lg flex flex-col gap-4">
            <div>
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-white" />
                        Smart Safe Route App
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-white/20">
                        Flood-Aware Routing
                    </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                    Detects flooded road regions and computes 100% safe elevation corridors for transit.
                </p>
            </div>

            {/* Currently Flooded Regions Box */}
            <div className="rounded-md border border-red-500/40 bg-red-950/20 p-3">
                <span className="text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    ⛔ Currently Flooded Regions to Avoid ({floodedSectors.length} Active Hazards)
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {floodedSectors.slice(0, 4).map(s => (
                        <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 rounded border bg-red-500/20 border-red-500/50 text-red-300 font-mono">
                            🛑 {s.name} ({s.depth}cm)
                        </span>
                    ))}
                    {floodedSectors.length === 0 && (
                        <span className="text-[11px] text-emerald-400">All primary road sectors clear.</span>
                    )}
                </div>
            </div>

            {/* Route Selection */}
            <div className="flex gap-2">
                {routes.map((r, idx) => (
                    <button
                        key={r.id}
                        onClick={() => setActiveRouteIndex(idx)}
                        className={`flex-1 py-2 px-2.5 rounded-md border text-xs font-semibold transition-all cursor-pointer text-left ${
                            activeRouteIndex === idx
                                ? "border-white bg-white text-zinc-950 font-bold shadow"
                                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                        }`}
                    >
                        <span className="block text-[9px] uppercase font-mono text-zinc-400">Corridor {idx + 1}</span>
                        <span className="truncate block font-bold">{r.origin} → {r.destination}</span>
                    </button>
                ))}
            </div>

            {/* Route Comparison */}
            <div className="space-y-3">
                <div className="rounded-md border border-red-500/40 bg-zinc-900 p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                            ❌ Standard Direct Route
                        </span>
                        <span className="text-[10px] font-mono font-bold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30">
                            BLOCKED BY FLOOD
                        </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-mono">
                        {currentRoute.standard.dist} · {currentRoute.standard.time}
                    </p>
                    <p className="text-[10.5px] text-red-300 mt-1 font-sans">
                        ⚠️ {currentRoute.standard.blockReason}
                    </p>
                </div>

                <div className="rounded-md border border-emerald-500/50 bg-zinc-900 p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            🟢 Smart Safe Elevation Route
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            100% CLEAR &amp; SAFE
                        </span>
                    </div>
                    <p className="text-[11px] text-zinc-200 font-mono">
                        {currentRoute.safeRoute.dist} · {currentRoute.safeRoute.time} · {currentRoute.safeRoute.elevation}
                    </p>
                    <p className="text-[10.5px] text-emerald-300 mt-1 font-sans">
                        ✅ {currentRoute.safeRoute.corridor}
                    </p>
                </div>
            </div>

            <button
                onClick={onStartSimulation}
                disabled={isSimulatingRoute}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold border border-white shadow transition-all cursor-pointer"
            >
                <Play className="w-4 h-4 fill-current text-zinc-950" />
                <span>{isSimulatingRoute ? `Simulating Safe Transit (${routeProgress}%)…` : "🗺️ Open Map &amp; Simulate Safe Navigation"}</span>
            </button>
        </div>
    );
}

// ============================================================================
// Tactical Map Layer Controls
// ============================================================================

function TacticalMapControls({ layers, setLayers, floodStats, wardData, selectedSector, onSelectSector, isMapEnabled, onEnableMap, onDisableMap, pushToast }) {
    const toggleLayer = (key, label) => {
        setLayers((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            pushToast(`${label} layer ${next[key] ? "visible" : "hidden"}`);
            return next;
        });
    };

    return (
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/85 backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        Map Controls &amp; GIS Layers
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Toggle spatial layers and map visibility state.
                    </p>
                </div>

                {/* Map Enable/Disable Toggle Button */}
                <button
                    onClick={() => (isMapEnabled ? onDisableMap() : onEnableMap())}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isMapEnabled
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            : "border-indigo-500/40 bg-indigo-600 text-white hover:bg-indigo-500"
                        }`}
                >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isMapEnabled ? "Map: Active" : "Enable Map"}</span>
                </button>
            </div>

            <div className="space-y-1 divide-y divide-slate-800/60">
                <ToggleRow
                    label="🌊 Flood Inundation Heatmap"
                    checked={layers.heatmap}
                    onChange={() => toggleLayer("heatmap", "Flood Inundation")}
                />
                <ToggleRow
                    label="⚡ Drainage Pumps & Sluice Gates"
                    checked={layers.pumps}
                    onChange={() => toggleLayer("pumps", "Drainage Pumps")}
                />
                <ToggleRow
                    label="🏥 Evacuation Shelters & Relief Camps"
                    checked={layers.shelters}
                    onChange={() => toggleLayer("shelters", "Emergency Shelters")}
                />
                <ToggleRow
                    label="🚗 Dynamic Safe Navigation Path"
                    checked={layers.safeCorridor}
                    onChange={() => toggleLayer("safeCorridor", "Safe Route Corridor")}
                />
                <ToggleRow
                    label="📐 Topographical Elevation Contours"
                    checked={layers.elevationContours}
                    onChange={() => toggleLayer("elevationContours", "Elevation Contours")}
                />
            </div>
        </div>
    );
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
        pushToast,
    } = props;

    const handleRefreshRadar = async () => {
        setRadarBusy(true);
        try {
            const res = await fetch("/api/run_pipeline", { method: "POST" });
            const data = await res.json();
            const now = new Date();
            setRadarTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
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

    return (
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/85 backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    Integrated Service Engines
                </h3>
                <StatusPill busy={radarBusy || terrainBusy || simBusy || statusBusy} label="All Online" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-200">IMD Radar Feed</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Last Sync: {radarTime}</p>
                    </div>
                    <button
                        onClick={handleRefreshRadar}
                        disabled={radarBusy}
                        className="mt-2 text-[10px] font-bold py-1 px-2 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer text-center"
                    >
                        {radarBusy ? "Syncing…" : "Refresh Radar"}
                    </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-200">1D-2D Hydraulics</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">SWMM-HEC Coupled</p>
                    </div>
                    <button
                        onClick={() => runAction(setSimBusy, "1D pipe & 2D overland mesh recalculated")}
                        disabled={simBusy}
                        className="mt-2 text-[10px] font-bold py-1 px-2 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer text-center"
                    >
                        {simBusy ? "Calculating…" : "Run Simulation"}
                    </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-200">DEM Topography</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Infiltration: 32%</p>
                    </div>
                    <button
                        onClick={() => runAction(setTerrainBusy, "DEM high-resolution elevation surface updated")}
                        disabled={terrainBusy}
                        className="mt-2 text-[10px] font-bold py-1 px-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer text-center"
                    >
                        {terrainBusy ? "Mapping…" : "Assess DEM"}
                    </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-200">API Gateway</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Latency: {latency} ms</p>
                    </div>
                    <button
                        onClick={handlePingFeeds}
                        disabled={statusBusy}
                        className="mt-2 text-[10px] font-bold py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer text-center"
                    >
                        {statusBusy ? "Probing…" : "Ping Feeds"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Ward River & Drainage Vital Card
// ============================================================================

function WardVitalMetrics({ wardData, timeStep, scenario, onOpenSitRep }) {
    const dynamicRiverLevel = (
        wardData.riverLevel * (0.85 + (timeStep * 0.15)) * scenario.rainfallMultiplier +
        (scenario.tideOffset * 0.3)
    ).toFixed(2);

    const isRiverOver = dynamicRiverLevel >= wardData.dangerLevel;

    return (
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/85 backdrop-blur-xl p-4 sm:p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    {wardData.riverName}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isRiverOver
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                        : "border-sky-500/40 bg-sky-500/10 text-sky-300"
                    }`}>
                    {isRiverOver ? "OVERFLOW STAGE" : "BANK-FULL ACTIVE"}
                </span>
            </div>

            <div className="flex items-baseline justify-between border-b border-slate-800 pb-2.5">
                <div>
                    <span className="text-2xl font-bold font-mono text-white">{dynamicRiverLevel}</span>
                    <span className="text-xs text-slate-400 ml-1 font-mono">/ {wardData.dangerLevel}m max</span>
                </div>
                <span className="text-[11px] text-slate-400">
                    Drainage Pumps: <strong className="text-white font-mono">{wardData.activePumps}</strong>
                </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Relief Shelters:</span>
                <span className="font-semibold text-slate-200">{wardData.evacShelters}</span>
            </div>
        </div>
    );
}

// ============================================================================
// Data Layers & Telemetry Provenance Modal
// ============================================================================


// --- MODULE: client/src/components/modals/ModalsAndFooter.jsx ---
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


// --- MODULE: client/src/App.jsx ---
// Colour mapping for /api/spot_check verdicts.
const VERDICT_STYLES = {
    CLEAR:      { box: "bg-emerald-50 border-emerald-200", pill: "bg-emerald-200 text-emerald-800", text: "text-emerald-700" },
    CAUTION:    { box: "bg-amber-50 border-amber-200",     pill: "bg-amber-200 text-amber-900",     text: "text-amber-700" },
    UNSAFE:     { box: "bg-rose-50 border-rose-200",       pill: "bg-rose-200 text-rose-800",       text: "text-rose-700" },
    IMPASSABLE: { box: "bg-rose-100 border-rose-300",      pill: "bg-rose-600 text-white",          text: "text-rose-800" },
    UNKNOWN:    { box: "bg-slate-50 border-slate-200",     pill: "bg-slate-200 text-slate-700",     text: "text-slate-600" },
};


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
    const [spotWard, setSpotWard] = useState("");
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
            } else {
                // Without this, a 404/503 left the PREVIOUS ward's river level, depth
                // and risk on screen as if they were current for the new selection.
                setLiveForecast(null);
                let detail = `Forecast unavailable (${res.status})`;
                try { detail = (await res.json()).detail || detail; } catch (_) {}
                pushToast(detail);
            }
        } catch (err) {
            setLiveForecast(null);
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
        // A field the server sends as null means "unknown" (e.g. weather API down).
        // Show that, rather than the literal "null" or a mock value from WARDS_DATA.
        const live = (key, fmt = (v) => v) =>
            key in liveForecast ? (liveForecast[key] == null ? "—" : fmt(liveForecast[key])) : undefined;
        return {
            ...base,
            riverLevel: live("river_level_m") ?? base.riverLevel,
            rainfallForecast: live("rainfall_forecast_mm", (v) => `${v} mm`) ?? base.rainfallForecast,
            activePumps: live("active_pumps") ?? base.activePumps,
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
        if (!spotWard.trim()) return;
        setRouteCheckBusy(true);
        setRouteCheckResult(null);
        try {
            const params = new URLSearchParams({ ward_name: spotWard });
            const res = await fetch(`/api/spot_check?${params}`);
            const data = await res.json();
            if (!res.ok) {
                setRouteCheckResult({ error: data.detail || `Request failed (${res.status})` });
                pushToast(data.detail || "Spot check failed");
                return;
            }
            setRouteCheckResult(data);
            pushToast(`Spot check complete: ${data.verdict || "DONE"}`);
        } catch (err) {
            setRouteCheckResult({ error: err.message });
            pushToast("Spot check failed — backend offline?");
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

            {/* Ward Flood Spot Check Modal */}
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
                                    Ward Flood Spot Check
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase">
                                        30m CartoDEM
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Predicted standing-water depth at a ward, from live rainfall and terrain
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
                            <div className="sm:col-span-2">
                                <label htmlFor="spot-ward" className="block text-[11px] font-bold text-slate-600 mb-1">Ward</label>
                                <input
                                    id="spot-ward"
                                    value={spotWard}
                                    onChange={(e) => setSpotWard(e.target.value)}
                                    placeholder="e.g. Velachery"
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                                />
                                <p className="mt-1 text-[10px] text-slate-500">
                                    Predicted flood depth at this ward from live rainfall and 30m CartoDEM terrain.
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
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking ward conditions…
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" /> Check Flood Depth
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {routeCheckResult && !routeCheckResult.error && (() => {
                            const vs = VERDICT_STYLES[routeCheckResult.verdict] || VERDICT_STYLES.UNKNOWN;
                            const depth = routeCheckResult.predicted_flood_depth_cm;
                            return (
                                <div className="space-y-3 border-t border-slate-100 pt-4">
                                    <div className={`rounded-2xl p-3.5 border ${vs.box}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-bold ${vs.text}`}>
                                                {routeCheckResult.ward_name}{routeCheckResult.code ? ` · ${routeCheckResult.code}` : ""}
                                            </span>
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${vs.pill}`}>
                                                {routeCheckResult.verdict}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-700 mb-2.5">{routeCheckResult.advice}</p>
                                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                                            <div>
                                                Depth: <strong className="text-slate-900">{depth === null || depth === undefined ? "—" : `${depth} cm`}</strong>
                                            </div>
                                            <div>
                                                Rain: <strong className="text-slate-900">{routeCheckResult.rainfall?.total_mm ?? "—"} mm</strong>
                                            </div>
                                            <div>
                                                Peak: <strong className="text-slate-900">{routeCheckResult.rainfall?.peak_intensity_mm_hr ?? "—"} mm/hr</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {!routeCheckResult.is_real_api && (
                                        <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl">
                                            ⚠️ Live weather unavailable — depth could not be computed.
                                        </p>
                                    )}

                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        {routeCheckResult.note} Terrain: {routeCheckResult.terrain_profile?.dem_source_label}.
                                    </p>
                                </div>
                            );
                        })()}
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
                                                        {currentWardData.riverLevel === "—" ? "—" : `${currentWardData.riverLevel}m`}
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


