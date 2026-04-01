import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { modeColors } from "./routeData";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface RouteMapProps {
  visibleModes: Set<string>;
  origin: string;
  destination: string;
  routes: Record<string, [number, number][]>;
  startPoint: [number, number];
  endPoint: [number, number];
}

function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coordinates, map]);
  return null;
}

export default function RouteMap({
  visibleModes,
  origin,
  destination,
  routes,
  startPoint,
  endPoint,
}: RouteMapProps) {
  const allCoords = Object.values(routes).flat();
  const center: [number, number] =
    allCoords.length > 0
      ? [
          allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length,
          allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length,
        ]
      : startPoint;

  return (
    <div className="rounded-lg overflow-hidden border border-border shadow-card">
      <div className="bg-card px-4 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium">Route Map</span>
        <div className="flex items-center gap-3">
          {Object.entries(modeColors).map(([mode, color]) => (
            <div
              key={mode}
              className="flex items-center gap-1.5 text-xs"
              style={{ opacity: visibleModes.has(mode) ? 1 : 0.3 }}
            >
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{mode}</span>
            </div>
          ))}
        </div>
      </div>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "400px", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds coordinates={allCoords} />

        {Object.entries(routes).map(([mode, coords]) =>
          visibleModes.has(mode) && coords.length > 0 ? (
            <Polyline
              key={mode}
              positions={coords}
              pathOptions={{
                color: modeColors[mode],
                weight: mode === "Cycling" ? 5 : 3,
                opacity: mode === "Cycling" ? 0.9 : 0.6,
                dashArray: mode === "Walking" ? "8, 8" : undefined,
              }}
            />
          ) : null
        )}

        <Marker position={startPoint}>
          <Popup>{origin}</Popup>
        </Marker>
        <Marker position={endPoint}>
          <Popup>{destination}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
