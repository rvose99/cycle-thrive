import { useState } from "react";
import { MapPin, ArrowRight, Bike, Bus, Car, Clock, Leaf, Flame, Euro, ChevronDown, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const bikeTypes = ["City Bike", "E-Bike", "Road Bike", "HSL City Bike"] as const;
const tripTypes = ["Regular", "With Children", "Minimal Activity", "Cargo"] as const;

interface ComparisonData {
  mode: string;
  icon: React.ReactNode;
  time: string;
  cost: string;
  co2: string;
  kcal: string;
  highlight?: boolean;
}

const comparisonResults: ComparisonData[] = [
  {
    mode: "Cycling",
    icon: <Bike className="h-5 w-5" />,
    time: "28 min",
    cost: "€0.00",
    co2: "0 g",
    kcal: "320 kcal",
    highlight: true,
  },
  {
    mode: "HSL Transit",
    icon: <Bus className="h-5 w-5" />,
    time: "42 min",
    cost: "€2.80",
    co2: "840 g",
    kcal: "45 kcal",
  },
  {
    mode: "Private Car",
    icon: <Car className="h-5 w-5" />,
    time: "18 min",
    cost: "€4.60",
    co2: "2,100 g",
    kcal: "12 kcal",
  },
];

export default function RoutePlanner() {
  const [origin, setOrigin] = useState("Kamppi, Helsinki");
  const [destination, setDestination] = useState("Otaniemi, Espoo");
  const [bikeType, setBikeType] = useState<string>("City Bike");
  const [tripType, setTripType] = useState<string>("Regular");
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="space-y-6">
      {/* Route Input */}
      <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in">
        <h3 className="font-semibold text-lg mb-1">Plan Your Route</h3>
        <p className="text-sm text-muted-foreground mb-5">Compare cycling with other transport modes in the Helsinki region</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <input
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Starting point"
            />
          </div>
          <div className="relative">
            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
            <input
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
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
                  onClick={() => setBikeType(b)}
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
                  onClick={() => setTripType(t)}
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

        <Button onClick={() => setShowResults(true)} className="w-full sm:w-auto">
          <ArrowRight className="h-4 w-4 mr-2" />
          Compare Routes
        </Button>
      </div>

      {/* Comparison Results */}
      {showResults && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="font-semibold text-lg">
            {origin} <ArrowRight className="inline h-4 w-4 mx-1 text-muted-foreground" /> {destination}
          </h3>
          <p className="text-sm text-muted-foreground">~8.4 km via Munkkiniemi • {bikeType} • {tripType}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonResults.map((r) => (
              <div
                key={r.mode}
                className={cn(
                  "rounded-lg p-5 transition-all",
                  r.highlight
                    ? "bg-primary/5 border-2 border-primary shadow-elevated"
                    : "bg-card shadow-card border border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn("p-2 rounded-lg", r.highlight ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                    {r.icon}
                  </div>
                  <span className="font-semibold">{r.mode}</span>
                  {r.highlight && (
                    <span className="ml-auto text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Best
                    </span>
                  )}
                </div>
                <div className="space-y-3">
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
              </div>
            ))}
          </div>

          {/* Savings Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <h4 className="font-semibold mb-2">💡 By cycling this route daily</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Monthly savings</p>
                <p className="text-lg font-bold text-accent">€92.00</p>
              </div>
              <div>
                <p className="text-muted-foreground">CO₂ avoided</p>
                <p className="text-lg font-bold text-eco">42 kg</p>
              </div>
              <div>
                <p className="text-muted-foreground">Calories burned</p>
                <p className="text-lg font-bold text-calorie">6,400</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time difference</p>
                <p className="text-lg font-bold text-foreground">+10 min/trip</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
