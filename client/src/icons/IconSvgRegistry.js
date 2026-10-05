/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
// Global references — loaded via UMD scripts in index.html
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const ICON_SVGS = {
    // Drawn from lucide-static 0.460.0 (ISC). These names were declared below
    // but had no drawing, so they rendered as a placeholder circle.
    AlertOctagon: <g><path d="M12 16h.01" /> <path d="M12 8v4" /> <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" /></g>,
    Bell: <g><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /> <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></g>,
    Car: <g><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /> <circle cx="7" cy="17" r="2" /> <path d="M9 17h6" /> <circle cx="17" cy="17" r="2" /></g>,
    CloudRain: <g><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /> <path d="M16 14v6" /> <path d="M8 14v6" /> <path d="M12 16v6" /></g>,
    Copy: <g><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /> <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></g>,
    Crosshair: <g><circle cx="12" cy="12" r="10" /> <line x1="22" x2="18" y1="12" y2="12" /> <line x1="6" x2="2" y1="12" y2="12" /> <line x1="12" x2="12" y1="6" y2="2" /> <line x1="12" x2="12" y1="22" y2="18" /></g>,
    Minus: <g><path d="M5 12h14" /></g>,
    Plus: <g><path d="M5 12h14" /> <path d="M12 5v14" /></g>,
    Power: <g><path d="M12 2v10" /> <path d="M18.4 6.6a9 9 0 1 1-12.77.04" /></g>,
    Printer: <g><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /> <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" /> <rect x="6" y="14" width="12" height="8" rx="1" /></g>,
    Send: <g><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /> <path d="m21.854 2.147-10.94 10.939" /></g>,
    Server: <g><rect width="20" height="8" x="2" y="2" rx="2" ry="2" /> <rect width="20" height="8" x="2" y="14" rx="2" ry="2" /> <line x1="6" x2="6.01" y1="6" y2="6" /> <line x1="6" x2="6.01" y1="18" y2="18" /></g>,
    Volume2: <g><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /> <path d="M16 9a5 5 0 0 1 0 6" /> <path d="M19.364 18.364a9 9 0 0 0 0-12.728" /></g>,
    VolumeX: <g><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /> <line x1="22" x2="16" y1="9" y2="15" /> <line x1="16" x2="22" y1="9" y2="15" /></g>,
    Zap: <g><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></g>,
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
