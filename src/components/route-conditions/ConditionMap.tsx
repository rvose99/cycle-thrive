import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ConditionReport, ratingColors, ratingLabels } from "./types";

function FitToReports({ reports }: { reports: ConditionReport[] }) {
  const map = useMap();
  useEffect(() => {
    const allCoords: [number, number][] = [];
    reports.forEach((r) => {
      if (r.point) allCoords.push(r.point);
      if (r.sectionStart) allCoords.push(r.sectionStart);
      if (r.sectionEnd) allCoords.push(r.sectionEnd);
    });
    if (allCoords.length > 0) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40], maxZoom: 15 });
    }
  }, [reports, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (point: [number, number]) => void }) {
  useMapEvents({
    click: (event) => onMapClick([event.latlng.lat, event.latlng.lng]),
  });
  return null;
}

interface ConditionMapProps {
  reports: ConditionReport[];
  draftPoint?: [number, number];
  draftSectionStart?: [number, number];
  draftSectionEnd?: [number, number];
  onMapClick?: (point: [number, number]) => void;
}

export default function ConditionMap({
  reports,
  draftPoint,
  draftSectionStart,
  draftSectionEnd,
  onMapClick,
}: ConditionMapProps) {
  // Default center: Helsinki
  const defaultCenter: [number, number] = [60.1699, 24.9384];

  return (
    <div className="rounded-lg overflow-hidden border border-border shadow-card">
      <div className="bg-card px-4 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium">Reported Conditions</span>
        <div className="flex items-center gap-3">
          {(["good", "mediocre", "bad"] as const).map((rating) => (
            <div key={rating} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ratingColors[rating] }}
              />
              <span className="text-muted-foreground">{ratingLabels[rating]}</span>
            </div>
          ))}
        </div>
      </div>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "450px", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {reports.length > 0 && <FitToReports reports={reports} />}

        {draftPoint && (
          <CircleMarker
            center={draftPoint}
            radius={8}
            pathOptions={{
              color: "hsl(var(--primary))",
              fillColor: "hsl(var(--primary))",
              fillOpacity: 0.4,
              weight: 2,
              dashArray: "4 4",
            }}
          />
        )}

        {draftSectionStart && (
          <CircleMarker
            center={draftSectionStart}
            radius={8}
            pathOptions={{
              color: "hsl(var(--primary))",
              fillColor: "hsl(var(--primary))",
              fillOpacity: 0.4,
              weight: 2,
              dashArray: "4 4",
            }}
          />
        )}

        {draftSectionEnd && (
          <CircleMarker
            center={draftSectionEnd}
            radius={8}
            pathOptions={{
              color: "hsl(var(--accent))",
              fillColor: "hsl(var(--accent))",
              fillOpacity: 0.4,
              weight: 2,
              dashArray: "4 4",
            }}
          />
        )}

        {draftSectionStart && draftSectionEnd && (
          <Polyline
            positions={[draftSectionStart, draftSectionEnd]}
            pathOptions={{
              color: "hsl(var(--primary))",
              weight: 3,
              opacity: 0.6,
              dashArray: "8 8",
            }}
          />
        )}

        {reports.map((report) => {
          if (report.type === "point" && report.point) {
            return (
              <CircleMarker
                key={report.id}
                center={report.point}
                radius={10}
                pathOptions={{
                  color: ratingColors[report.rating],
                  fillColor: ratingColors[report.rating],
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold">{ratingLabels[report.rating]} Condition</div>
                    <div className="text-xs">{report.reason}</div>
                    {report.description && (
                      <div className="text-xs text-gray-500">{report.description}</div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          }

          if (report.type === "section" && report.sectionCoords?.length) {
            return (
              <Polyline
                key={report.id}
                positions={report.sectionCoords}
                pathOptions={{
                  color: ratingColors[report.rating],
                  weight: 6,
                  opacity: 0.7,
                }}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold">{ratingLabels[report.rating]} Condition</div>
                    <div className="text-xs">{report.reason}</div>
                    {report.description && (
                      <div className="text-xs text-gray-500">{report.description}</div>
                    )}
                  </div>
                </Popup>
              </Polyline>
            );
          }

          return null;
        })}
      </MapContainer>
    </div>
  );
}
