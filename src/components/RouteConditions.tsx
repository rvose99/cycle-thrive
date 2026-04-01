import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import ConditionReportForm from "./route-conditions/ConditionReportForm";
import ConditionMap from "./route-conditions/ConditionMap";
import ReportsList from "./route-conditions/ReportsList";
import { ConditionReport, ReportType, ConditionRating } from "./route-conditions/types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function geocode(query: string): Promise<[number, number]> {
  const res = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
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
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found");
  return data.routes[0].geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
  );
}

export default function RouteConditions() {
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      setReports((prev) => [report, ...prev]);
      toast.success("Condition report submitted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.info("Report removed");
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
            <ConditionReportForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          <div className="rounded-lg bg-card border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold mb-3">
              Recent Reports ({reports.length})
            </h3>
            <ReportsList reports={reports} onDelete={handleDelete} />
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <ConditionMap reports={reports} />
        </div>
      </div>
    </div>
  );
}
