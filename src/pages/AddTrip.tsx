import { useState, useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bike, Footprints, Car, format as _f } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, RotateCcw, MapPin, Navigation, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { addLocalTrip } from "@/lib/localStore";
import { supabase } from "@/lib/supabase";
import { startIcon, endIcon } from "@/lib/leafletIcons";
import {
  geocode,
  fetchCyclingRouteDirect,
  fetchWalkingRouteDirect,
  fetchDrivingRouteDirect,
  reverseGeocode,
  type GeocodedPoint,
  type OSRMResult,
} from "@/components/route-planner/routingService";
import { bikeTypes } from "@/components/route-planner/types";

type Mode = "cycling" | "walking" | "car";

const KCAL_PER_KM: Record<string, number> = {
  "City Bike": 35,
  "E-Bike": 20,
  "Road Bike": 40,
  "HSL City Bike": 35,
  Walking: 60,
  Car: 12,
};

const ROUTE_COLOR: Record<Mode, string> = {
  cycling: "#3b82f6",
  walking: "#f97316",
  car: "#6b7280",
};

function MapResizer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 0); }, [map]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FitRoute({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
  }, [coords, map]);
  return null;
}

interface SavedStats {
  distanceKm: number;
  co2SavedKg: number;
  kcal: number;
  costSavedEur: number;
}

export default function AddTrip() {
  const { user, authSource } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("cycling");
  const [bikeType, setBikeType] = useState("City Bike");

  const [startPt, setStartPt] = useState<GeocodedPoint | null>(null);
  const [endPt, setEndPt] = useState<GeocodedPoint | null>(null);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [primaryResult, setPrimaryResult] = useState<OSRMResult | null>(null);
  const [drivingDistanceM, setDrivingDistanceM] = useState<number | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fetching, setFetching] = useState(false);
  const [geocodingStart, setGeocodingStart] = useState(false);
  const [geocodingEnd, setGeocodingEnd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedStats | null>(null);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const nextClick = useRef<"start" | "end">("start");
  useEffect(() => {
    nextClick.current = !startPt ? "start" : "end";
  }, [startPt, endPt]);

  // Re-fetch route when mode changes and both points are set
  const startPtRef = useRef(startPt);
  const endPtRef = useRef(endPt);
  startPtRef.current = startPt;
  endPtRef.current = endPt;

  const fetchRoute = useCallback(async (sp: GeocodedPoint, ep: GeocodedPoint) => {
    const currentMode = modeRef.current;
    setFetching(true);
    setError(null);
    setRoute(null);
    try {
      let primary: OSRMResult;
      let driveDistM: number | null = null;

      if (currentMode === "cycling") {
        const [cycling, driving] = await Promise.all([
          fetchCyclingRouteDirect(sp, ep),
          fetchDrivingRouteDirect(sp, ep),
        ]);
        primary = cycling;
        driveDistM = driving.distanceM;
      } else if (currentMode === "walking") {
        const [walking, driving] = await Promise.all([
          fetchWalkingRouteDirect(sp, ep),
          fetchDrivingRouteDirect(sp, ep),
        ]);
        primary = walking;
        driveDistM = driving.distanceM;
      } else {
        primary = await fetchDrivingRouteDirect(sp, ep);
        driveDistM = null;
      }

      setRoute(primary.coords);
      setPrimaryResult(primary);
      setDrivingDistanceM(driveDistM);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not find route");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (startPtRef.current && endPtRef.current) {
      fetchRoute(startPtRef.current, endPtRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const reset = () => {
    setStartPt(null); setEndPt(null);
    setStartInput(""); setEndInput("");
    setRoute(null); setPrimaryResult(null); setDrivingDistanceM(null);
    setError(null); setSaved(null);
  };

  const handleGeocode = async (field: "start" | "end") => {
    const text = field === "start" ? startInput : endInput;
    if (!text.trim()) return;
    if (field === "start") setGeocodingStart(true); else setGeocodingEnd(true);
    setError(null);
    try {
      const pt = await geocode(text.trim());
      if (field === "start") {
        setStartPt(pt);
        setRoute(null); setPrimaryResult(null); setDrivingDistanceM(null);
        if (endPtRef.current) await fetchRoute(pt, endPtRef.current);
      } else {
        setEndPt(pt);
        setRoute(null); setPrimaryResult(null); setDrivingDistanceM(null);
        if (startPtRef.current) await fetchRoute(startPtRef.current, pt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Location not found");
    } finally {
      if (field === "start") setGeocodingStart(false); else setGeocodingEnd(false);
    }
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const pt: GeocodedPoint = { lat, lon: lng };
    const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    if (nextClick.current === "start") {
      setStartPt(pt);
      setRoute(null); setPrimaryResult(null); setDrivingDistanceM(null);
      setError(null); setSaved(null);
      setStartInput(fallback);
      reverseGeocode(lat, lng).then(setStartInput);
      nextClick.current = "end";
    } else {
      setEndPt(pt);
      setEndInput(fallback);
      reverseGeocode(lat, lng).then(setEndInput);
      setStartPt((currentStart) => {
        if (currentStart) fetchRoute(currentStart, pt);
        return currentStart;
      });
    }
  }, [fetchRoute]);

  const handleSave = async () => {
    if (!user || !startPt || !endPt || !primaryResult) return;
    setSaving(true);
    setError(null);

    const distanceKm = primaryResult.distanceM / 1000;
    const driveKm = drivingDistanceM ? drivingDistanceM / 1000 : 0;
    const tripType = mode === "cycling" ? bikeType : mode === "walking" ? "Walking" : "Car";
    const kcalPerKm = KCAL_PER_KM[tripType] ?? 35;
    const kcal = Math.round(distanceKm * kcalPerKm);
    const co2SavedG = mode === "car" ? 0 : Math.round(driveKm * 150);
    const costSavedEur = mode === "car" ? 0 : Math.round((driveKm * 0.25 + 2) * 100) / 100;

    const trip = {
      date,
      origin: startInput || `${startPt.lat.toFixed(4)},${startPt.lon.toFixed(4)}`,
      destination: endInput || `${endPt.lat.toFixed(4)},${endPt.lon.toFixed(4)}`,
      distance_m: Math.round(primaryResult.distanceM),
      duration_s: Math.round(primaryResult.durationS),
      co2_saved_g: co2SavedG,
      kcal,
      cost_saved_eur: costSavedEur,
      trip_type: tripType,
    };

    if (authSource === "local") {
      addLocalTrip(user.id, trip);
    } else {
      const { error: dbError } = await supabase.from("trips").insert({
        user_id: user.id,
        ...trip,
      });

      if (dbError) {
        setError(dbError.message);
        setSaving(false);
        return;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["trips", authSource, user.id] });
    setSaved({
      distanceKm: Math.round(distanceKm * 10) / 10,
      co2SavedKg: Math.round(co2SavedG / 100) / 10,
      kcal,
      costSavedEur,
    });
    setSaving(false);
  };

  const mapHint = !startPt
    ? "Click the map or type above to set start"
    : !endPt
    ? "Click the map or type above to set end — click a pin to remove it"
    : fetching
    ? "Calculating route…"
    : route
    ? "Route ready — pick a date and save"
    : "";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Add a Trip</h3>
          <p className="text-sm text-muted-foreground">Type locations or click the map to set start and end points</p>
        </div>
        {(startPt || startInput) && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Mode selector */}
      <div className="bg-card rounded-lg shadow-card p-4 space-y-3">
        <div className="flex gap-2">
          {(["cycling", "walking", "car"] as Mode[]).map((m) => {
            const Icon = m === "cycling" ? Bike : m === "walking" ? Footprints : Car;
            return (
              <button
                key={m}
                onClick={() => { setMode(m); setRoute(null); setPrimaryResult(null); setDrivingDistanceM(null); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {m === "cycling" ? "Cycling" : m === "walking" ? "Walking" : "Car"}
              </button>
            );
          })}
        </div>

        {mode === "cycling" && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Bike type</p>
            <div className="flex flex-wrap gap-2">
              {bikeTypes.map((b) => (
                <button
                  key={b}
                  onClick={() => setBikeType(b)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    bikeType === b ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text inputs */}
      <div className="bg-card rounded-lg shadow-card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            <input
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Start location"
              value={startInput}
              onChange={(e) => { setStartInput(e.target.value); setStartPt(null); setRoute(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleGeocode("start")}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleGeocode("start")} disabled={geocodingStart || !startInput.trim()}>
            {geocodingStart ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
            <input
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="End location"
              value={endInput}
              onChange={(e) => { setEndInput(e.target.value); setEndPt(null); setRoute(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleGeocode("end")}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleGeocode("end")} disabled={geocodingEnd || !endInput.trim()}>
            {geocodingEnd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-border shadow-card">
        <div className="bg-card px-4 py-2.5 border-b border-border flex items-center justify-between min-h-[42px]">
          <span className="text-xs text-muted-foreground italic">{mapHint}</span>
          {fetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <MapContainer center={[60.1699, 24.9384]} zoom={12} style={{ height: "400px", width: "100%" }} scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapResizer />
          <MapClickHandler onClick={handleMapClick} />
          {route && <FitRoute coords={route} />}
          {startPt && (
            <Marker position={[startPt.lat, startPt.lon]} icon={startIcon}
              eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); setStartPt(null); setStartInput(""); setRoute(null); setPrimaryResult(null); setDrivingDistanceM(null); } }}
            />
          )}
          {endPt && (
            <Marker position={[endPt.lat, endPt.lon]} icon={endIcon}
              eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); setEndPt(null); setEndInput(""); setRoute(null); setPrimaryResult(null); setDrivingDistanceM(null); } }}
            />
          )}
          {route && <Polyline positions={route} pathOptions={{ color: ROUTE_COLOR[mode], weight: 5, opacity: 0.85 }} />}
        </MapContainer>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {route && !saved && (
        <div className="bg-card rounded-lg shadow-card p-5 flex items-end gap-4 animate-fade-in">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
            <input
              type="date"
              className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={date}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Trip"}
          </Button>
        </div>
      )}

      {saved && (
        <div className="bg-card rounded-lg shadow-card p-6 border border-primary/30 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Trip saved!</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              { label: "Distance", value: `${saved.distanceKm} km` },
              { label: "Calories", value: `${saved.kcal} kcal` },
              { label: "CO₂ saved", value: `${saved.co2SavedKg} kg` },
              { label: "Money saved", value: `€${saved.costSavedEur.toFixed(2)}` },
            ].map((s) => (
              <div key={s.label} className="bg-secondary/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{s.label}</p>
                <p className="font-semibold">{s.value}</p>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={reset}>Add another trip</Button>
        </div>
      )}
    </div>
  );
}
