import { useQuery } from "@tanstack/react-query";
import { startOfMonth, endOfMonth, addDays, format, startOfDay, subDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalTrips } from "@/lib/localStore";
import { supabase } from "@/lib/supabase";

export interface Trip {
  id: string;
  date: string;
  origin: string;
  destination: string;
  start_lat?: number | null;
  start_lon?: number | null;
  end_lat?: number | null;
  end_lon?: number | null;
  distance_m: number;
  duration_s: number;
  co2_saved_g: number;
  kcal: number;
  cost_saved_eur: number;
  trip_type: string;
}

export function tripMode(trip: Trip): "cycling" | "walking" | "car" {
  if (trip.trip_type === "Car") return "car";
  if (trip.trip_type === "Walking") return "walking";
  return "cycling";
}

export function useTrips() {
  const { user, authSource } = useAuth();

  return useQuery({
    queryKey: ["trips", authSource, user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      if (authSource === "local") {
        return getLocalTrips(user.id);
      }

      const { data, error } = await supabase
        .from("trips")
        .select("id, date, origin, destination, start_lat, start_lon, end_lat, end_lon, distance_m, duration_s, co2_saved_g, kcal, cost_saved_eur, trip_type")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Trip[];
    },
  });
}

export function computeStats(trips: Trip[]) {
  const now = new Date();
  const today = startOfDay(now);
  const rollingStart = subDays(today, 6);
  const todayStr = format(today, "yyyy-MM-dd");
  const rollingStartStr = format(rollingStart, "yyyy-MM-dd");
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const weekTrips = trips.filter((t) => t.date >= rollingStartStr && t.date <= todayStr);
  const monthTrips = trips.filter((t) => {
    const d = new Date(t.date);
    return d >= monthStart && d <= monthEnd;
  });

  // Exclude car trips over 50 km from the activity chart
  const chartTrips = (arr: Trip[]) =>
    arr.filter((t) => !(tripMode(t) === "car" && t.distance_m > 50000));

  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(rollingStart, i);
    const dayStr = format(day, "yyyy-MM-dd");
    const dayTrips = chartTrips(weekTrips).filter((t) => t.date === dayStr);

    const byMode = (m: "cycling" | "walking" | "car") =>
      Math.round(
        dayTrips
          .filter((t) => tripMode(t) === m)
          .reduce((sum, t) => sum + t.distance_m / 1000, 0) * 10
      ) / 10;

    const cycling = byMode("cycling");
    const walking = byMode("walking");
    const car = byMode("car");

    return {
      day: format(day, "EEE"),
      cycling,
      walking,
      car,
      total: Math.round((cycling + walking + car) * 10) / 10,
    };
  });

  const sum = (arr: Trip[], key: keyof Trip) =>
    arr.reduce((s, t) => s + Number(t[key]), 0);

  return {
    weekDistanceKm: Math.round(sum(chartTrips(weekTrips), "distance_m") / 100) / 10,
    weekCo2SavedKg: Math.round(sum(weekTrips, "co2_saved_g") / 100) / 10,
    weekCostSavedEur: Math.round(sum(weekTrips, "cost_saved_eur") * 100) / 100,
    weekCalories: Math.round(sum(weekTrips, "kcal")),
    monthDistanceKm: Math.round(sum(monthTrips, "distance_m") / 100) / 10,
    monthCo2SavedKg: Math.round(sum(monthTrips, "co2_saved_g") / 100) / 10,
    monthCalories: Math.round(sum(monthTrips, "kcal")),
    weeklyActivity,
    recentTrips: trips.slice(0, 5),
  };
}
