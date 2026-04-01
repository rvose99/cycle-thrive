import { useState } from "react";
import { Bike, Bus, Car, ArrowRight, Footprints, Loader2 } from "lucide-react";
import RouteInputForm from "./route-planner/RouteInputForm";
import RouteComparisonCards from "./route-planner/RouteComparisonCards";
import RouteSavingsSummary from "./route-planner/RouteSavingsSummary";
import RouteMap from "./route-planner/RouteMap";
import { ComparisonData } from "./route-planner/types";
import { modeColors } from "./route-planner/routeData";
import { fetchAllRoutes, AllRoutesResult } from "./route-planner/routingService";

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins} min` : `${hours}h`;
}

function buildComparison(result: AllRoutesResult): ComparisonData[] {
  const { cycling, walking, driving } = result;
  const cycleKm = cycling.distanceM / 1000;
  const walkKm = walking.distanceM / 1000;
  const driveKm = driving.distanceM / 1000;

  const cycleKcal = Math.round(cycleKm * 35);
  const walkKcal = Math.round(walkKm * 60);
  const transitMinutes = Math.round((driveKm / 20) * 60) + 10;
  const transitCO2g = Math.round(driveKm * 80);
  const carCO2g = Math.round(driveKm * 150);
  const carCostEur = driveKm * 0.25 + 2;

  return [
    {
      mode: "Cycling",
      icon: <Bike className="h-5 w-5" />,
      time: formatDuration(cycling.durationS),
      cost: "€0.00",
      co2: "0 g",
      kcal: `${cycleKcal} kcal`,
      color: modeColors["Cycling"],
      highlight: true,
    },
    {
      mode: "Walking",
      icon: <Footprints className="h-5 w-5" />,
      time: formatDuration(walking.durationS),
      cost: "€0.00",
      co2: "0 g",
      kcal: `${walkKcal} kcal`,
      color: modeColors["Walking"],
    },
    {
      mode: "HSL Transit",
      icon: <Bus className="h-5 w-5" />,
      time: `${transitMinutes} min`,
      cost: "€2.80",
      co2: `${transitCO2g.toLocaleString()} g`,
      kcal: "15 kcal",
      color: modeColors["HSL Transit"],
    },
    {
      mode: "Private Car",
      icon: <Car className="h-5 w-5" />,
      time: formatDuration(driving.durationS),
      cost: `€${carCostEur.toFixed(2)}`,
      co2: `${carCO2g.toLocaleString()} g`,
      kcal: "12 kcal",
      color: modeColors["Private Car"],
    },
  ];
}

function buildRoutes(result: AllRoutesResult): Record<string, [number, number][]> {
  return {
    Cycling: result.cycling.coords,
    Walking: result.walking.coords,
    "HSL Transit": result.driving.coords,
    "Private Car": result.driving.coords,
  };
}

function buildSavings(result: AllRoutesResult) {
  const cycleKm = result.cycling.distanceM / 1000;
  const driveKm = result.driving.distanceM / 1000;
  const cycleMinutes = Math.round(result.cycling.durationS / 60);
  const carMinutes = Math.round(result.driving.durationS / 60);

  const carCostPerTrip = driveKm * 0.25 + 2;
  const tripsPerMonth = 44; // 22 working days × 2
  return {
    monthlySavingsEur: Math.round(carCostPerTrip * tripsPerMonth),
    co2AvoidedKgPerMonth: Math.round((driveKm * 150 * tripsPerMonth) / 1000),
    caloriesPerMonth: Math.round(cycleKm * 35 * tripsPerMonth),
    timeDiffMinPerTrip: cycleMinutes - carMinutes,
  };
}

export default function RoutePlanner() {
  const [origin, setOrigin] = useState("Kamppi, Helsinki");
  const [destination, setDestination] = useState("Otaniemi, Espoo");
  const [bikeType, setBikeType] = useState("City Bike");
  const [tripType, setTripType] = useState("Regular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<AllRoutesResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonData[]>([]);
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [visibleModes, setVisibleModes] = useState<Set<string>>(
    new Set(["Cycling", "Walking", "HSL Transit", "Private Car"])
  );

  const toggleMode = (mode: string) => {
    setVisibleModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  };

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllRoutes(origin, destination);
      setRouteResult(result);
      setComparison(buildComparison(result));
      setRoutes(buildRoutes(result));
      setDistanceKm(Math.round(result.cycling.distanceM / 100) / 10);
      setVisibleModes(new Set(["Cycling", "Walking", "HSL Transit", "Private Car"]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  const savings = routeResult ? buildSavings(routeResult) : null;

  return (
    <div className="space-y-6">
      <RouteInputForm
        origin={origin}
        destination={destination}
        bikeType={bikeType}
        tripType={tripType}
        onOriginChange={setOrigin}
        onDestinationChange={setDestination}
        onBikeTypeChange={setBikeType}
        onTripTypeChange={setTripType}
        onCompare={handleCompare}
      />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Fetching routes…</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && routeResult && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-semibold text-lg">
              {origin}{" "}
              <ArrowRight className="inline h-4 w-4 mx-1 text-muted-foreground" />{" "}
              {destination}
            </h3>
            <p className="text-sm text-muted-foreground">
              ~{distanceKm} km cycling route • {bikeType} • {tripType}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click a card to toggle its route on the map
            </p>
          </div>

          <RouteComparisonCards
            results={comparison}
            visibleModes={visibleModes}
            onToggleMode={toggleMode}
          />

          <RouteMap
            visibleModes={visibleModes}
            origin={origin}
            destination={destination}
            routes={routes}
            startPoint={[routeResult.originPoint.lat, routeResult.originPoint.lon]}
            endPoint={[routeResult.destPoint.lat, routeResult.destPoint.lon]}
          />

          {savings && <RouteSavingsSummary {...savings} />}
        </div>
      )}
    </div>
  );
}
