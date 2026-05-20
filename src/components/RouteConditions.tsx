import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import ConditionReportForm from "./route-conditions/ConditionReportForm";
import ConditionMap from "./route-conditions/ConditionMap";
import ReportsList from "./route-conditions/ReportsList";
import { ConditionReport, ReportType, ConditionRating } from "./route-conditions/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface NominatimResult {
  lat: string;
  lon: string;
}

interface CyclingRouteResponse {
  code: string;
  routes?: Array<{
    geometry: {
      coordinates: [number, number][];
    };
  }>;
}

interface ConditionReportRow {
  id: string;
  user_id: string;
  type: ReportType;
  rating: ConditionRating;
  reason: string;
  description: string | null;
  created_at: string;
  point: [number, number] | null;
  section_start: [number, number] | null;
  section_end: [number, number] | null;
  section_coords: [number, number][] | null;
}

const conditionReportsQueryKey = ["condition-reports"];

const mapConditionReportRow = (row: ConditionReportRow): ConditionReport => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  rating: row.rating,
  reason: row.reason,
  description: row.description ?? "",
  timestamp: new Date(row.created_at),
  point: row.point ?? undefined,
  sectionStart: row.section_start ?? undefined,
  sectionEnd: row.section_end ?? undefined,
  sectionCoords: row.section_coords ?? undefined,
});

const parseCoordinateQuery = (query: string): [number, number] | null => {
  const match = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return [lat, lng];
};

async function geocode(query: string): Promise<[number, number]> {
  const coordinate = parseCoordinateQuery(query);
  if (coordinate) return coordinate;

  const res = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!res.ok) throw new Error("Geocoding failed");
  const data = (await res.json()) as NominatimResult[];
  if (!data.length) throw new Error(`Location not found: "${query}"`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function fetchCyclingRoute(
  start: [number, number],
  end: [number, number]
): Promise<[number, number][]> {
  const url = `https://routing.openstreetmap.de/routed-bike/route/v1/cycling/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing failed");
  const data = (await res.json()) as CyclingRouteResponse;
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found");
  return data.routes[0].geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
  );
}

export default function RouteConditions() {
  const { user, authSource } = useAuth();
  const queryClient = useQueryClient();
  const isDatabaseUser = authSource === "supabase" && !!user;
  const [reportType, setReportType] = useState<ReportType>("point");
  const [locationQuery, setLocationQuery] = useState("");
  const [endLocationQuery, setEndLocationQuery] = useState("");
  const [draftPoint, setDraftPoint] = useState<[number, number] | undefined>();
  const [draftSectionStart, setDraftSectionStart] = useState<[number, number] | undefined>();
  const [draftSectionEnd, setDraftSectionEnd] = useState<[number, number] | undefined>();
  const [localReports, setLocalReports] = useState<ConditionReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: databaseReports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: conditionReportsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condition_reports")
        .select("id, user_id, type, rating, reason, description, created_at, point, section_start, section_end, section_coords")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as ConditionReportRow[]).map(mapConditionReportRow);
    },
  });

  const reports = isDatabaseUser ? databaseReports : [...localReports, ...databaseReports];
  const formatPoint = ([lat, lng]: [number, number]) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const handleReportTypeChange = (nextType: ReportType) => {
    setReportType(nextType);
    setLocationQuery("");
    setEndLocationQuery("");
    setDraftPoint(undefined);
    setDraftSectionStart(undefined);
    setDraftSectionEnd(undefined);
  };

  const handleMapClick = (point: [number, number]) => {
    if (reportType === "point") {
      setDraftPoint(point);
      setLocationQuery(formatPoint(point));
      return;
    }

    if (!draftSectionStart || (draftSectionStart && draftSectionEnd)) {
      setDraftSectionStart(point);
      setDraftSectionEnd(undefined);
      setLocationQuery(formatPoint(point));
      setEndLocationQuery("");
      return;
    }

    setDraftSectionEnd(point);
    setEndLocationQuery(formatPoint(point));
  };

  const handleSubmit = async (data: {
    type: ReportType;
    rating: ConditionRating;
    reason: string;
    description: string;
    locationQuery: string;
    endLocationQuery?: string;
  }) => {
    setIsLoading(true);
    try {
      const report: ConditionReport = {
        id: crypto.randomUUID(),
        userId: user?.id,
        type: data.type,
        rating: data.rating,
        reason: data.reason,
        description: data.description,
        timestamp: new Date(),
      };

      if (data.type === "point") {
        report.point = await geocode(data.locationQuery);
      } else {
        const [start, end] = await Promise.all([
          geocode(data.locationQuery),
          geocode(data.endLocationQuery!),
        ]);
        report.sectionStart = start;
        report.sectionEnd = end;
        report.sectionCoords = await fetchCyclingRoute(start, end);
      }

      if (isDatabaseUser) {
        const { error } = await supabase.from("condition_reports").insert({
          user_id: user.id,
          type: report.type,
          rating: report.rating,
          reason: report.reason,
          description: report.description,
          point: report.point ?? null,
          section_start: report.sectionStart ?? null,
          section_end: report.sectionEnd ?? null,
          section_coords: report.sectionCoords ?? null,
        });

        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: conditionReportsQueryKey });
      } else {
        setLocalReports((prev) => [report, ...prev]);
        await queryClient.invalidateQueries({ queryKey: conditionReportsQueryKey });
      }

      toast.success("Condition report submitted!");
      setLocationQuery("");
      setEndLocationQuery("");
      setDraftPoint(undefined);
      setDraftSectionStart(undefined);
      setDraftSectionEnd(undefined);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (isDatabaseUser) {
        const { error } = await supabase
          .from("condition_reports")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: conditionReportsQueryKey });
      } else {
        setLocalReports((prev) => prev.filter((r) => r.id !== id));
      }

      toast.info("Report removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove report");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-accent" />
          Route Conditions
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Report and view cycling route conditions across Helsinki
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 space-y-5">
          <div className="rounded-lg bg-card border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold mb-4">New Report</h3>
            <ConditionReportForm
              type={reportType}
              locationQuery={locationQuery}
              endLocationQuery={endLocationQuery}
              onTypeChange={handleReportTypeChange}
              onLocationQueryChange={(value) => {
                setLocationQuery(value);
                if (reportType === "point") setDraftPoint(undefined);
                if (reportType === "section") setDraftSectionStart(undefined);
              }}
              onEndLocationQueryChange={(value) => {
                setEndLocationQuery(value);
                setDraftSectionEnd(undefined);
              }}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>

          <div className="rounded-lg bg-card border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold mb-3">
              Recent Reports ({isLoadingReports ? "..." : reports.length})
            </h3>
            <ReportsList reports={reports} currentUserId={user?.id} onDelete={handleDelete} />
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <ConditionMap
            reports={reports}
            draftPoint={reportType === "point" ? draftPoint : undefined}
            draftSectionStart={reportType === "section" ? draftSectionStart : undefined}
            draftSectionEnd={reportType === "section" ? draftSectionEnd : undefined}
            onMapClick={handleMapClick}
          />
        </div>
      </div>
    </div>
  );
}
