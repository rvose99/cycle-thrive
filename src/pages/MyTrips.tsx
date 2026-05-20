import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2, Trash2, MapPin, Bike, Footprints, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTrips, type Trip } from "@/hooks/useTrips";
import { deleteLocalTrip } from "@/lib/localStore";
import { supabase } from "@/lib/supabase";
import { startIcon, endIcon } from "@/lib/leafletIcons";
import {
  geocode,
  fetchCyclingRouteDirect,
  fetchWalkingRouteDirect,
  fetchDrivingRouteDirect,
  type GeocodedPoint,
} from "@/components/route-planner/routingService";

const WALKING_TYPES = ["Walking"];
const CAR_TYPES = ["Car"];

function tripRouteColor(tripType: string) {
  if (CAR_TYPES.includes(tripType)) return "#6b7280";
  if (WALKING_TYPES.includes(tripType)) return "#f97316";
  return "#3b82f6";
}

function TripTypeIcon({ tripType }: { tripType: string }) {
  if (CAR_TYPES.includes(tripType)) return <Car className="h-3 w-3" />;
  if (WALKING_TYPES.includes(tripType)) return <Footprints className="h-3 w-3" />;
  return <Bike className="h-3 w-3" />;
}

function TripTypeBadge({ tripType }: { tripType: string }) {
  const isWalking = WALKING_TYPES.includes(tripType);
  const isCar = CAR_TYPES.includes(tripType);
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      isCar ? "bg-muted text-muted-foreground" :
      isWalking ? "bg-orange-100 text-orange-700" :
      "bg-blue-100 text-blue-700"
    )}>
      <TripTypeIcon tripType={tripType} />
      {tripType}
    </span>
  );
}

interface RouteData {
  coords: [number, number][];
  startPt: GeocodedPoint;
  endPt: GeocodedPoint;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 0); }, [map]);
  return null;
}

function FitRoute({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
    }
  }, [coords, map]);
  return null;
}

function TripCard({
  trip,
  expanded,
  onToggle,
  onDelete,
}: {
  trip: Trip;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const handleToggle = async () => {
    onToggle();
    if (!expanded && !routeData) {
      setRouteLoading(true);
      setRouteError(null);
      try {
        const [startPt, endPt] = await Promise.all([
          geocode(trip.origin),
          geocode(trip.destination),
        ]);
        const fetchFn = CAR_TYPES.includes(trip.trip_type)
          ? fetchDrivingRouteDirect
          : WALKING_TYPES.includes(trip.trip_type)
          ? fetchWalkingRouteDirect
          : fetchCyclingRouteDirect;
        const result = await fetchFn(startPt, endPt);
        setRouteData({ coords: result.coords, startPt, endPt });
      } catch {
        setRouteError("Could not load route map");
      } finally {
        setRouteLoading(false);
      }
    }
  };

  const distanceKm = Math.round(trip.distance_m / 100) / 10;
  const co2Kg = Math.round(trip.co2_saved_g / 100) / 10;
  const durationMin = Math.round(trip.duration_s / 60);

  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5 shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {trip.origin} → {trip.destination}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <TripTypeBadge tripType={trip.trip_type} />
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(trip.date), "d MMM yyyy")} · {distanceKm} km · {durationMin} min
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggle}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="bg-secondary/50 rounded p-2">
            <p className="text-muted-foreground">CO₂ saved</p>
            <p className="font-semibold text-eco">{co2Kg} kg</p>
          </div>
          <div className="bg-secondary/50 rounded p-2">
            <p className="text-muted-foreground">Calories</p>
            <p className="font-semibold">{trip.kcal} kcal</p>
          </div>
          <div className="bg-secondary/50 rounded p-2">
            <p className="text-muted-foreground">Money saved</p>
            <p className="font-semibold text-accent">€{Number(trip.cost_saved_eur).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {routeLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading route…
            </div>
          )}
          {routeError && (
            <p className="text-sm text-destructive p-4">{routeError}</p>
          )}
          {routeData && (
            <MapContainer
              center={[routeData.startPt.lat, routeData.startPt.lon]}
              zoom={13}
              style={{ height: "300px", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapResizer />
              <FitRoute coords={routeData.coords} />
              <Polyline
                positions={routeData.coords}
                pathOptions={{ color: tripRouteColor(trip.trip_type), weight: 5, opacity: 0.85 }}
              />
              <Marker position={[routeData.startPt.lat, routeData.startPt.lon]} icon={startIcon} />
              <Marker position={[routeData.endPt.lat, routeData.endPt.lon]} icon={endIcon} />
            </MapContainer>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyTrips() {
  const { user, authSource } = useAuth();
  const queryClient = useQueryClient();
  const { data: trips = [], isLoading } = useTrips();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    if (authSource === "local") {
      deleteLocalTrip(user.id, id);
    } else {
      await supabase.from("trips").delete().eq("id", id).eq("user_id", user.id);
    }

    await queryClient.invalidateQueries({ queryKey: ["trips", authSource, user?.id] });
    if (expandedId === id) setExpandedId(null);
  };

  const totalKm = Math.round(trips.reduce((s, t) => s + t.distance_m / 1000, 0) * 10) / 10;
  const totalCo2 = Math.round(trips.reduce((s, t) => s + t.co2_saved_g, 0) / 100) / 10;
  const totalEur = Math.round(trips.reduce((s, t) => s + Number(t.cost_saved_eur), 0) * 100) / 100;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">My Trips</h3>
        <p className="text-sm text-muted-foreground">All your logged cycling trips</p>
      </div>

      {!isLoading && trips.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total distance", value: `${totalKm} km` },
            { label: "Total CO₂ saved", value: `${totalCo2} kg` },
            { label: "Total money saved", value: `€${totalEur.toFixed(2)}` },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-lg shadow-card p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold text-lg">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading trips…
        </div>
      )}

      {!isLoading && trips.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No trips yet — add your first one from the "Add a Trip" tab!
        </p>
      )}

      <div className="space-y-3">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            expanded={expandedId === trip.id}
            onToggle={() => handleToggle(trip.id)}
            onDelete={() => handleDelete(trip.id)}
          />
        ))}
      </div>
    </div>
  );
}
