import { MapPin, ArrowRight, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { bikeTypes, tripTypes } from "./types";

interface RouteInputFormProps {
  origin: string;
  destination: string;
  bikeType: string;
  tripType: string;
  onOriginChange: (v: string) => void;
  onDestinationChange: (v: string) => void;
  onBikeTypeChange: (v: string) => void;
  onTripTypeChange: (v: string) => void;
  onCompare: () => void;
}

export default function RouteInputForm({
  origin, destination, bikeType, tripType,
  onOriginChange, onDestinationChange, onBikeTypeChange, onTripTypeChange,
  onCompare,
}: RouteInputFormProps) {
  return (
    <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in">
      <h3 className="font-semibold text-lg mb-1">Plan Your Route</h3>
      <p className="text-sm text-muted-foreground mb-5">Compare cycling with other transport modes in the Helsinki region</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <input
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            placeholder="Starting point"
          />
        </div>
        <div className="relative">
          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
          <input
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="Destination"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bicycle Type</label>
          <div className="flex flex-wrap gap-2">
            {bikeTypes.map((b) => (
              <button
                key={b}
                onClick={() => onBikeTypeChange(b)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  bikeType === b
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Trip Type</label>
          <div className="flex flex-wrap gap-2">
            {tripTypes.map((t) => (
              <button
                key={t}
                onClick={() => onTripTypeChange(t)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  tripType === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={onCompare} className="w-full sm:w-auto">
        <ArrowRight className="h-4 w-4 mr-2" />
        Compare Routes
      </Button>
    </div>
  );
}
