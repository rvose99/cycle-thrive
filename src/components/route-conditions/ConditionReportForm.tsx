import { useState } from "react";
import { MapPin, Route, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ConditionRating,
  ReportType,
  faultReasons,
  ratingLabels,
} from "./types";

interface ConditionReportFormProps {
  type: ReportType;
  locationQuery: string;
  endLocationQuery: string;
  onTypeChange: (type: ReportType) => void;
  onLocationQueryChange: (value: string) => void;
  onEndLocationQueryChange: (value: string) => void;
  onSubmit: (data: {
    type: ReportType;
    rating: ConditionRating;
    reason: string;
    description: string;
    locationQuery: string;
    endLocationQuery?: string;
  }) => void;
  isLoading: boolean;
}

const ratingConfig: Record<
  ConditionRating,
  { icon: typeof CheckCircle; colorClass: string; bgClass: string }
> = {
  good: { icon: CheckCircle, colorClass: "text-primary", bgClass: "bg-primary/10 border-primary/30" },
  mediocre: { icon: AlertCircle, colorClass: "text-accent", bgClass: "bg-accent/10 border-accent/30" },
  bad: { icon: AlertTriangle, colorClass: "text-destructive", bgClass: "bg-destructive/10 border-destructive/30" },
};

export default function ConditionReportForm({
  type,
  locationQuery,
  endLocationQuery,
  onTypeChange,
  onLocationQueryChange,
  onEndLocationQueryChange,
  onSubmit,
  isLoading,
}: ConditionReportFormProps) {
  const [rating, setRating] = useState<ConditionRating>("mediocre");
  const [reason, setReason] = useState<string>(faultReasons[0]);
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    if (type === "section" && !endLocationQuery.trim()) return;
    onSubmit({
      type,
      rating,
      reason,
      description,
      locationQuery: locationQuery.trim(),
      endLocationQuery: type === "section" ? endLocationQuery.trim() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Report type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Report Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "point" as ReportType, label: "Specific Location", icon: MapPin },
            { id: "section" as ReportType, label: "Route Section", icon: Route },
          ]).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTypeChange(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                  type === item.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location inputs */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {type === "point" ? "Location" : "Section Start"}
          </Label>
          <Input
            placeholder="e.g. Mannerheimintie 10, Helsinki"
            value={locationQuery}
            onChange={(e) => onLocationQueryChange(e.target.value)}
            required
          />
        </div>
        {type === "section" && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Section End</Label>
            <Input
              placeholder="e.g. Töölönkatu 3, Helsinki"
              value={endLocationQuery}
              onChange={(e) => onEndLocationQueryChange(e.target.value)}
              required
            />
          </div>
        )}
      </div>

      {/* Condition rating */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Condition</Label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ratingConfig) as ConditionRating[]).map((r) => {
            const config = ratingConfig[r];
            const Icon = config.icon;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-sm font-medium transition-colors",
                  rating === r
                    ? config.bgClass
                    : "bg-card text-muted-foreground border-border hover:bg-secondary"
                )}
              >
                <Icon className={cn("h-5 w-5", rating === r ? config.colorClass : "")} />
                {ratingLabels[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Reason</Label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {faultReasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Additional Details (optional)</Label>
        <Textarea
          placeholder="Describe the issue in more detail…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !locationQuery.trim()}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Locating…" : "Submit Report"}
      </button>
    </form>
  );
}
