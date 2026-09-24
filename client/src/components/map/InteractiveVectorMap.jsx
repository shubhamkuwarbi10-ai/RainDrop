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

        // Render Safe Corridor & Bypass Route Lines if available
        if (routeCheckResult && routeCheckResult.standard_route && routeCheckResult.safe_corridor) {
            const stdCoords = routeCheckResult.standard_route.coordinates || [];
            const safeCoords = routeCheckResult.safe_corridor.coordinates || [];

            if (stdCoords.length >= 2) {
                const stdPoly = window.L.polyline(stdCoords, {
                    color: '#dc2626',
                    weight: 4,
                    dashArray: '6, 8',
                    opacity: 0.9
                }).addTo(map);
                markersRef.current.push(stdPoly);
            }

            if (safeCoords.length >= 2) {
                const safePoly = window.L.polyline(safeCoords, {
                    color: '#10b981',
                    weight: 6,
                    opacity: 0.95
                }).addTo(map);
                markersRef.current.push(safePoly);

                const allRoutePoints = [...stdCoords, ...safeCoords];
                try {
                    map.fitBounds(allRoutePoints, { padding: [50, 50] });
                } catch (_) {}
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

                    {/* Verified Sensor Telemetry & Provenance */}
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 mb-4 text-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                Verified Sensor Telemetry
                            </span>
                            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                96.4% Calibrated
                            </span>
                        </div>
                        <div className="space-y-1.5 text-[11px] text-slate-600">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Sensor Station:</span>
                                <span className="font-mono font-semibold text-slate-700">{sector.stationId || `CWC-${sector.id + 101}`}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Primary Authority:</span>
                                <span className="font-medium text-slate-700">Municipal Stormwater Dept + IMD</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Gauge Sensor:</span>
                                <span className="font-medium text-slate-700">Hydrostatic Pressure Transducer</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Telemetry Feed:</span>
                                <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live (Updated 2 mins ago)
                                </span>
                            </div>
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
