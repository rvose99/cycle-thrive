import { Clock, Euro, Leaf, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComparisonData } from "./types";

interface RouteComparisonCardsProps {
  results: ComparisonData[];
  visibleModes: Set<string>;
  onToggleMode: (mode: string) => void;
}

export default function RouteComparisonCards({ results, visibleModes, onToggleMode }: RouteComparisonCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {results.map((r) => {
        const isVisible = visibleModes.has(r.mode);
        return (
          <button
            key={r.mode}
            onClick={() => onToggleMode(r.mode)}
            className={cn(
              "rounded-lg p-5 transition-all text-left",
              r.highlight
                ? "bg-primary/5 border-2 border-primary shadow-elevated"
                : "bg-card shadow-card border border-border",
              !isVisible && "opacity-40"
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: r.color + "20", color: r.color }}
              >
                {r.icon}
              </div>
              <span className="font-semibold text-sm">{r.mode}</span>
              {r.highlight && (
                <span className="ml-auto text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Best
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium ml-auto">{r.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-medium ml-auto">{r.cost}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">CO₂:</span>
                <span className="font-medium ml-auto">{r.co2}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Calories:</span>
                <span className="font-medium ml-auto">{r.kcal}</span>
              </div>
            </div>
            <div
              className="mt-3 h-1 rounded-full"
              style={{ backgroundColor: r.color }}
            />
          </button>
        );
      })}
    </div>
  );
}
