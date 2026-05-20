import { useState } from "react";
import { Bike, BarChart3, Trophy, Leaf, MapPin, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrips, computeStats, tripMode } from "@/hooks/useTrips";
import { Button } from "@/components/ui/button";
import { fetchCyclingRouteDirect, geocode, type GeocodedPoint } from "@/components/route-planner/routingService";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  colorClass?: string;
  delay?: number;
}

const StatCard = ({ icon, label, value, subtext, colorClass = "bg-primary", delay = 0 }: StatCardProps) => (
  <div
    className="rounded-lg bg-card shadow-card p-5 flex items-start gap-4 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={cn("rounded-lg p-2.5 text-primary-foreground", colorClass)}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  </div>
);

interface WhatIfResult {
  carTrips: number;
  co2SavedKg: number;
  moneySavedEur: number;
  caloriesBurned: number;
  netTimeMin: number;
  failedRoutes: number;
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
};

const hasSavedCoordinates = (trip: {
  start_lat?: number | null;
  start_lon?: number | null;
  end_lat?: number | null;
  end_lon?: number | null;
}) =>
  [trip.start_lat, trip.start_lon, trip.end_lat, trip.end_lon].every(
    (value) => typeof value === "number" && Number.isFinite(value),
  );

export default function Dashboard() {
  const { data: trips = [], isLoading } = useTrips();
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const stats = computeStats(trips);
  const maxKm = Math.max(...stats.weeklyActivity.map((d) => d.total), 1);
  const carTrips = trips.filter((trip) => tripMode(trip) === "car");

  const handleWhatIfCycling = async () => {
    setWhatIfLoading(true);
    setWhatIfError(null);
    setWhatIfResult(null);

    try {
      const routeResults = await Promise.allSettled(
        carTrips.map(async (trip) => {
          const [origin, destination]: [GeocodedPoint, GeocodedPoint] = hasSavedCoordinates(trip)
            ? [
                { lat: trip.start_lat!, lon: trip.start_lon! },
                { lat: trip.end_lat!, lon: trip.end_lon! },
              ]
            : await Promise.all([
                geocode(trip.origin),
                geocode(trip.destination),
              ]);
          const cycling = await fetchCyclingRouteDirect(origin, destination);
          const carDistanceKm = trip.distance_m / 1000;
          const timeDeltaS = trip.duration_s - cycling.durationS;

          return {
            co2SavedG: Math.round(carDistanceKm * 150),
            moneySavedEur: Math.round((carDistanceKm * 0.25 + 2) * 100) / 100,
            caloriesBurned: Math.round((cycling.distanceM / 1000) * 35),
            netTimeS: timeDeltaS,
          };
        }),
      );

      const successful = routeResults.filter((result) => result.status === "fulfilled");
      const totals = successful.reduce(
        (sum, result) => {
          if (result.status !== "fulfilled") return sum;
          return {
            co2SavedG: sum.co2SavedG + result.value.co2SavedG,
            moneySavedEur: sum.moneySavedEur + result.value.moneySavedEur,
            caloriesBurned: sum.caloriesBurned + result.value.caloriesBurned,
            netTimeS: sum.netTimeS + result.value.netTimeS,
          };
        },
        { co2SavedG: 0, moneySavedEur: 0, caloriesBurned: 0, netTimeS: 0 },
      );

      setWhatIfResult({
        carTrips: successful.length,
        co2SavedKg: Math.round(totals.co2SavedG / 100) / 10,
        moneySavedEur: Math.round(totals.moneySavedEur * 100) / 100,
        caloriesBurned: totals.caloriesBurned,
        netTimeMin: Math.round(totals.netTimeS / 60),
        failedRoutes: routeResults.length - successful.length,
      });
    } catch (error) {
      setWhatIfError(error instanceof Error ? error.message : "Could not calculate cycling alternatives.");
    } finally {
      setWhatIfLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Bike className="h-5 w-5" />}
          label="Distance Last 7 Days"
          value={`${stats.weekDistanceKm} km`}
          subtext={`${stats.weekCalories} kcal burned`}
          colorClass="bg-primary"
          delay={0}
        />
        <StatCard
          icon={<Leaf className="h-5 w-5" />}
          label="CO₂ Saved Last 7 Days"
          value={`${stats.weekCo2SavedKg} kg`}
          subtext="vs. driving a car"
          colorClass="bg-eco"
          delay={100}
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Money Saved Last 7 Days"
          value={`€${stats.weekCostSavedEur.toFixed(2)}`}
          subtext="vs. driving a car"
          colorClass="bg-accent"
          delay={200}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Trips This Month"
          value={`${trips.filter((t) => {
            const d = new Date(t.date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length}`}
          subtext={`${stats.monthDistanceKm} km total`}
          colorClass="bg-competition"
          delay={300}
        />
      </div>

      <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-lg">Car Trip Alternative</h3>
            <p className="text-sm text-muted-foreground">
              Reroute your logged car trips by bicycle and estimate what could have been avoided.
            </p>
          </div>
          <Button onClick={handleWhatIfCycling} disabled={whatIfLoading || isLoading || carTrips.length === 0}>
            {whatIfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            What if you would have cycled?
          </Button>
        </div>

        {carTrips.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground mt-4">No car trips logged yet.</p>
        )}

        {whatIfError && <p className="text-sm text-destructive mt-4">{whatIfError}</p>}

        {whatIfResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground">CO₂ avoidable</p>
              <p className="text-xl font-bold text-eco">{whatIfResult.co2SavedKg} kg</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground">Money avoidable</p>
              <p className="text-xl font-bold text-accent">€{whatIfResult.moneySavedEur.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground">Cycling calories</p>
              <p className="text-xl font-bold">{whatIfResult.caloriesBurned} kcal</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground">Time difference</p>
              <p className="text-xl font-bold">
                {whatIfResult.netTimeMin > 0
                  ? `${formatDuration(whatIfResult.netTimeMin)} saved`
                  : whatIfResult.netTimeMin < 0
                  ? `${formatDuration(Math.abs(whatIfResult.netTimeMin))} extra`
                  : "No difference"}
              </p>
            </div>
            <p className="sm:col-span-2 lg:col-span-4 text-xs text-muted-foreground">
              Calculated from {whatIfResult.carTrips} car trip{whatIfResult.carTrips === 1 ? "" : "s"}
              {whatIfResult.failedRoutes > 0 ? `; ${whatIfResult.failedRoutes} route${whatIfResult.failedRoutes === 1 ? "" : "s"} could not be calculated` : ""}.
              Time difference is driving route time minus cycling route time, without time spent finding car parking. Calories assume city-bike effort at 35 kcal/km.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-lg">Weekly Activity</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" />Cycling</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400" />Walking</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-gray-400" />Car</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Distance over the last 7 days by mode (car trips &gt;50 km excluded)</p>
          {isLoading ? (
            <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: "160px" }}>Loading…</div>
          ) : (
            <div className="flex items-end gap-2" style={{ height: "160px" }}>
              {stats.weeklyActivity.map((d) => {
                const barH = d.total > 0 ? Math.max((d.total / maxKm) * 116, 6) : 6;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-mono text-muted-foreground" style={{ height: "18px", lineHeight: "18px" }}>
                      {d.total > 0 ? `${d.total}` : "–"}
                    </span>
                    {d.total > 0 ? (
                      <div
                        className="w-full rounded-t-md overflow-hidden flex flex-col"
                        style={{ height: `${barH}px` }}
                      >
                        {d.cycling > 0 && (
                          <div className="bg-blue-500" style={{ height: `${(d.cycling / d.total) * barH}px` }} />
                        )}
                        {d.walking > 0 && (
                          <div className="bg-orange-400" style={{ height: `${(d.walking / d.total) * barH}px` }} />
                        )}
                        {d.car > 0 && (
                          <div className="bg-gray-400" style={{ height: `${(d.car / d.total) * barH}px` }} />
                        )}
                      </div>
                    ) : (
                      <div className="w-full rounded-t-sm bg-muted" style={{ height: "6px" }} />
                    )}
                    <span className="text-xs font-medium text-muted-foreground" style={{ height: "20px", lineHeight: "20px" }}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Goals Progress */}
        <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h3 className="font-semibold text-lg mb-1">Monthly Goals</h3>
          <p className="text-sm text-muted-foreground mb-5">This month's progress</p>
          <div className="space-y-5">
            {[
              { label: "100 km distance", progress: Math.min(Math.round((stats.monthDistanceKm / 100) * 100), 100), color: "bg-primary" },
              { label: "5,000 kcal burned", progress: Math.min(Math.round((stats.monthCalories / 5000) * 100), 100), color: "bg-calorie" },
              { label: "15 kg CO₂ saved", progress: Math.min(Math.round((stats.monthCo2SavedKg / 15) * 100), 100), color: "bg-eco" },
            ].map((goal) => (
              <div key={goal.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{goal.label}</span>
                  <span className="text-muted-foreground">{goal.progress}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000", goal.color)}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Rides */}
      <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <h3 className="font-semibold text-lg mb-1">Recent Rides</h3>
        <p className="text-sm text-muted-foreground mb-4">Your latest cycling trips</p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : stats.recentTrips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trips yet — add your first trip!</p>
        ) : (
          <div className="space-y-3">
            {stats.recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {trip.origin} → {trip.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(trip.distance_m / 100) / 10} km · {trip.date}
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-sm font-semibold text-accent">€{Number(trip.cost_saved_eur).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">saved</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-eco">{Math.round(trip.co2_saved_g / 100) / 10} kg</p>
                    <p className="text-xs text-muted-foreground">CO₂</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
