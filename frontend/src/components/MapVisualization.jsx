import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// Fix Leaflet generic marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const StartIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const EndIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function LocationMarker({ cities }) {
    const map = useMap();
    useEffect(() => {
        if (cities && cities.length > 0) {
            const bounds = L.latLngBounds(cities.map(c => [c.latitude, c.longitude]));
            if (bounds.isValid()) {
                map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, maxZoom: 12 });
            }
        }
    }, [cities, map]);
    return null;
}

export default function MapVisualization({ route, suggestedCities, allCities = [] }) {
    const [routePositions, setRoutePositions] = useState([]);
    const [fetchingRoute, setFetchingRoute] = useState(false);
    const mapRef = useRef(null);

    // Default center (Victoria BC approx)
    const center = [48.4284, -123.3656];

    useEffect(() => {
        // Force map to update size after mount to prevent grey tiles
        const timer = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!route || route.length < 2) {
            setRoutePositions([]);
            return;
        }

        const fetchRouteSegments = async () => {
            setFetchingRoute(true);
            let detailedPath = [];

            // Chunking strategy: fetch segment by segment to avoid OSRM limits and ensure correct order
            try {
                // For a tour, we have [A, B, C, D]. We need path A->B, B->C, C->D.
                for (let i = 0; i < route.length - 1; i++) {
                    const start = route[i];
                    const end = route[i + 1];
                    const url = `http://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;

                    try {
                        const response = await axios.get(url);
                        if (response.data.routes && response.data.routes.length > 0) {
                            const coords = response.data.routes[0].geometry.coordinates;
                            // OSRM returns [lon, lat], Leaflet needs [lat, lon]
                            // Use loop instead of spread to avoid stack overflow
                            for (const c of coords) {
                                detailedPath.push([c[1], c[0]]);
                            }
                        } else {
                            // Fallback to straight line
                            console.warn("No route found for segment", start.name, "to", end.name);
                            detailedPath.push([start.latitude, start.longitude]);
                            detailedPath.push([end.latitude, end.longitude]);
                        }
                    } catch (e) {
                        console.warn("OSRM fetch failed for segment, falling back to straight line", e);
                        detailedPath.push([start.latitude, start.longitude]);
                        detailedPath.push([end.latitude, end.longitude]);
                    }

                    // Small delay to respect rate limits
                    await new Promise(r => setTimeout(r, 150));
                }

                // Filter out invalid coordinates to prevent visual glitches (white screen/black artifacts)
                detailedPath = detailedPath.filter(p =>
                    Array.isArray(p) &&
                    p.length === 2 &&
                    !isNaN(p[0]) && !isNaN(p[1]) &&
                    Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180
                );

                setRoutePositions(detailedPath);
            } catch (err) {
                console.error("Failed to fetch OSRM route", err);
                // Fallback: simple mapping
                setRoutePositions(route.map(c => [c.latitude, c.longitude]));
            } finally {
                setFetchingRoute(false);
            }
        };

        fetchRouteSegments();
    }, [route]);

    return (
        <div className="h-full w-full relative text-left" style={{ height: "100%", width: "100%", minHeight: "400px" }}>
            <MapContainer
                key="map-container"
                ref={mapRef}
                center={center}
                zoom={5}
                scrollWheelZoom={true}
                className="h-full w-full leaflet-container"
                style={{ height: "100%", width: "100%", minHeight: "100%" }}
                zoomControl={false}
            >
                <ZoomControl position="bottomright" />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Draw Route Line - Base Layer */}
                {routePositions.length > 0 && (
                    <>
                        {/* Shadow/Outline for visibility */}
                        <Polyline
                            positions={routePositions}
                            pathOptions={{ color: 'black', weight: 10, opacity: 0.5, fill: false }}
                        />
                        {/* Main Colored Line */}
                        <Polyline
                            positions={routePositions}
                            pathOptions={{ color: '#6366f1', weight: 6, opacity: 0.8, lineCap: 'round', lineJoin: 'round', fill: false }}
                        />
                        {/* Animated Dash Line */}
                        <Polyline
                            positions={routePositions}
                            pathOptions={{ color: '#22d3ee', weight: 4, opacity: 1, lineCap: 'round', lineJoin: 'round', fill: false, className: 'route-line-animated' }}
                        />
                    </>
                )}

                {/* Markers */}
                {route && route.map((city, idx) => {
                    let icon = DefaultIcon;
                    if (idx === 0) icon = StartIcon;
                    else if (idx === route.length - 1) icon = EndIcon;

                    return (
                        <Marker key={`route-${idx}`} position={[city.latitude, city.longitude]} icon={icon}>
                            <Popup className="font-sans">
                                <div className="text-center">
                                    <h3 className="font-bold text-gray-800">{city.name}</h3>
                                    <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                                        {idx === 0 ? 'Start' : idx === route.length - 1 ? 'End' : `Stop #${idx}`}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Suggested Cities (ghosts) */}
                {suggestedCities && suggestedCities.map((city, idx) => (
                    <Marker key={`sugg-${idx}`} position={[city.latitude, city.longitude]} opacity={0.5}>
                        <Popup>
                            <strong>Suggested: {city.name}</strong>
                        </Popup>
                    </Marker>
                ))}

                <LocationMarker cities={route && route.length > 0 ? route : allCities} />
            </MapContainer>

            {fetchingRoute && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000] text-xs font-bold text-indigo-600 flex items-center animate-pulse border border-indigo-100">
                    <svg className="animate-spin -ml-1 mr-2" style={{ width: '12px', height: '12px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating Real Roads...
                </div>
            )}
        </div>
    );
}
