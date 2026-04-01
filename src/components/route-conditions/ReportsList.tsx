import { MapPin, Route, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConditionReport, ratingColors, ratingLabels } from "./types";

interface ReportsListProps {
  reports: ConditionReport[];
  onDelete: (id: string) => void;
}

export default function ReportsList({ reports, onDelete }: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No reports yet. Submit one above to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <div
          key={report.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border"
        >
          <div
            className="rounded-full p-1.5 mt-0.5"
            style={{ backgroundColor: `${ratingColors[report.rating]}20` }}
          >
            {report.type === "point" ? (
              <MapPin className="h-4 w-4" style={{ color: ratingColors[report.rating] }} />
            ) : (
              <Route className="h-4 w-4" style={{ color: ratingColors[report.rating] }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${ratingColors[report.rating]}20`,
                  color: ratingColors[report.rating],
                }}
              >
                {ratingLabels[report.rating]}
              </span>
              <span className="text-xs text-muted-foreground">{report.reason}</span>
            </div>
            {report.description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{report.description}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {report.timestamp.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => onDelete(report.id)}
            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
