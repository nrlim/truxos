"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

// Custom colored markers
const createColoredIcon = (color: string) =>
    new L.DivIcon({
        className: "custom-marker",
        html: `<div style="
            width: 28px; height: 28px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,.3);
            position: relative;
        "><div style="
            width: 10px; height: 10px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
        "></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    });

const originIcon = createColoredIcon("#3b82f6"); // blue
const destIcon = createColoredIcon("#10b981"); // green

interface MapPickerProps {
    originCoords?: string | null;
    destinationCoords?: string | null;
    onChangeOrigin: (coords: string) => void;
    onChangeDestination: (coords: string) => void;
    onDistanceCalculated?: (distanceKm: number) => void;
}

function MapEventsHandler({
    pickingMode,
    onPick
}: {
    pickingMode: "origin" | "destination" | null;
    onPick: (coords: { lat: number, lng: number }) => void;
}) {
    useMapEvents({
        click(e) {
            if (pickingMode) {
                onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
            }
        },
    });
    return null;
}

function FlyToHandler({
    origin,
    dest,
}: {
    origin: { lat: number; lng: number } | null;
    dest: { lat: number; lng: number } | null;
}) {
    const map = useMap();
    const prevOriginRef = useRef<string | null>(null);
    const prevDestRef = useRef<string | null>(null);

    useEffect(() => {
        const originKey = origin ? `${origin.lat},${origin.lng}` : null;
        const destKey = dest ? `${dest.lat},${dest.lng}` : null;

        if (originKey === prevOriginRef.current && destKey === prevDestRef.current) return;
        prevOriginRef.current = originKey;
        prevDestRef.current = destKey;

        if (origin && dest) {
            const bounds = L.latLngBounds(
                [origin.lat, origin.lng],
                [dest.lat, dest.lng]
            );
            map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
        } else if (origin) {
            map.flyTo([origin.lat, origin.lng], 13, { duration: 1.2 });
        } else if (dest) {
            map.flyTo([dest.lat, dest.lng], 13, { duration: 1.2 });
        }
    }, [origin, dest, map]);

    return null;
}

export default function MapPickerClient({
    originCoords,
    destinationCoords,
    onChangeOrigin,
    onChangeDestination,
    onDistanceCalculated,
}: MapPickerProps) {
    const defaultCenter: [number, number] = [-6.200000, 106.816666];

    const [origin, setOrigin] = useState<{ lat: number, lng: number } | null>(
        originCoords ? JSON.parse(originCoords) : null
    );
    const [dest, setDest] = useState<{ lat: number, lng: number } | null>(
        destinationCoords ? JSON.parse(destinationCoords) : null
    );

    const [pickingMode, setPickingMode] = useState<"origin" | "destination" | null>(null);
    const [routeLine, setRouteLine] = useState<[number, number][]>([]);

    useEffect(() => {
        if (originCoords) {
            try { setOrigin(JSON.parse(originCoords)); } catch { /* ignore */ }
        } else {
            setOrigin(null);
        }
    }, [originCoords]);

    useEffect(() => {
        if (destinationCoords) {
            try { setDest(JSON.parse(destinationCoords)); } catch { /* ignore */ }
        } else {
            setDest(null);
        }
    }, [destinationCoords]);

    const stableOnDistanceCalculated = useRef(onDistanceCalculated);
    stableOnDistanceCalculated.current = onDistanceCalculated;

    // Fetch route from OSRM to draw polyline and get distance
    useEffect(() => {
        if (origin && dest) {
            let ignore = false;
            const fetchRoute = async () => {
                try {
                    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`);
                    const data = await res.json();
                    if (!ignore && data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        const distanceKm = route.distance / 1000;
                        if (stableOnDistanceCalculated.current) {
                            stableOnDistanceCalculated.current(Number(distanceKm.toFixed(1)));
                        }

                        const coordinates = route.geometry.coordinates.map(
                            (coord: number[]) => [coord[1], coord[0]] as [number, number]
                        );
                        setRouteLine(coordinates);
                    }
                } catch (error) {
                    console.error("Failed to fetch route", error);
                }
            };
            fetchRoute();
            return () => { ignore = true; };
        } else {
            setRouteLine([]);
        }
    }, [origin, dest]);

    const handlePick = (coords: { lat: number, lng: number }) => {
        if (pickingMode === "origin") {
            const str = JSON.stringify(coords);
            onChangeOrigin(str);
            setOrigin(coords);
        } else if (pickingMode === "destination") {
            const str = JSON.stringify(coords);
            onChangeDestination(str);
            setDest(coords);
        }
        setPickingMode(null);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
                <button
                    type="button"
                    onClick={() => setPickingMode(pickingMode === "origin" ? null : "origin")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border ${pickingMode === "origin" ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
                >
                    <LocateFixed className="w-4 h-4" />
                    {origin ? "Ubah Titik Asal" : "Set Titik Asal"}
                </button>
                <button
                    type="button"
                    onClick={() => setPickingMode(pickingMode === "destination" ? null : "destination")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border ${pickingMode === "destination" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
                >
                    <LocateFixed className="w-4 h-4" />
                    {dest ? "Ubah Titik Tujuan" : "Set Titik Tujuan"}
                </button>

                {/* Legend */}
                {(origin || dest) && (
                    <div className="flex items-center gap-3 ml-auto text-xs text-slate-400 font-medium">
                        {origin && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Asal
                            </span>
                        )}
                        {dest && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tujuan
                            </span>
                        )}
                    </div>
                )}
            </div>

            {pickingMode && (
                <div className={`p-3 rounded-lg text-sm font-medium border flex items-center gap-2 animate-in fade-in ${pickingMode === "origin"
                        ? "bg-blue-50 text-blue-800 border-blue-100"
                        : "bg-emerald-50 text-emerald-800 border-emerald-100"
                    }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${pickingMode === "origin" ? "bg-blue-500" : "bg-emerald-500"
                        }`} />
                    Klik di peta untuk menentukan koordinat {pickingMode === "origin" ? "Asal" : "Tujuan"}.
                </div>
            )}

            <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0 bg-slate-100">
                <MapContainer center={origin ? [origin.lat, origin.lng] : defaultCenter} zoom={origin ? 13 : 10} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&amp;copy <a href="https://osm.org/copyright">OSM</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    <MapEventsHandler pickingMode={pickingMode} onPick={handlePick} />
                    <FlyToHandler origin={origin} dest={dest} />

                    {origin && (
                        <Marker position={[origin.lat, origin.lng]} icon={originIcon} />
                    )}
                    {dest && (
                        <Marker position={[dest.lat, dest.lng]} icon={destIcon} />
                    )}

                    {routeLine.length > 0 && (
                        <Polyline
                            positions={routeLine}
                            color="#3b82f6"
                            weight={4}
                            opacity={0.8}
                            dashArray="8 4"
                        />
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
