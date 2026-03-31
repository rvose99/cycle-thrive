import { useState } from "react";
import { Bike, Bus, Car, ArrowRight, Footprints } from "lucide-react";
import RouteInputForm from "./route-planner/RouteInputForm";
import RouteComparisonCards from "./route-planner/RouteComparisonCards";
import RouteSavingsSummary from "./route-planner/RouteSavingsSummary";
import RouteMap from "./route-planner/RouteMap";
import { ComparisonData } from "./route-planner/types";
import { modeColors } from "./route-planner/routeData";

const comparisonResults: ComparisonData[] = [
  {
    mode: "Cycling",
    icon: <Bike className="h-5 w-5" />,
    time: "28 min",
    cost: "€0.00",
    co2: "0 g",
    kcal: "320 kcal",
    color: modeColors["Cycling"],
    highlight: true,
  },
  {
    mode: "Walking",
    icon: <Footprints className="h-5 w-5" />,
    time: "1h 48 min",
    cost: "€0.00",
    co2: "0 g",
    kcal: "480 kcal",
    color: modeColors["Walking"],
  },
  {
    mode: "HSL Transit",
    icon: <Bus className="h-5 w-5" />,
    time: "42 min",
    cost: "€2.80",
    co2: "840 g",
    kcal: "45 kcal",
    color: modeColors["HSL Transit"],
  },
  {
    mode: "Private Car",
    icon: <Car className="h-5 w-5" />,
    time: "18 min",
    cost: "€4.60",
    co2: "2,100 g",
    kcal: "12 kcal",
    color: modeColors["Private Car"],
  },
];

export default function RoutePlanner() {
  const [origin, setOrigin] = useState("Kamppi, Helsinki");
  const [destination, setDestination] = useState("Otaniemi, Espoo");
  const [bikeType, setBikeType] = useState("City Bike");
  const [tripType, setTripType] = useState("Regular");
  const [showResults, setShowResults] = useState(false);
  const [visibleModes, setVisibleModes] = useState<Set<string>>(
    new Set(comparisonResults.map((r) => r.mode))
  );

  const toggleMode = (mode: string) => {
    setVisibleModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  };

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
        onCompare={() => setShowResults(true)}
      />

      {showResults && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="font-semibold text-lg">
              {origin} <ArrowRight className="inline h-4 w-4 mx-1 text-muted-foreground" /> {destination}
            </h3>
            <p className="text-sm text-muted-foreground">~8.4 km via Munkkiniemi • {bikeType} • {tripType}</p>
            <p className="text-xs text-muted-foreground mt-1">Click a card to toggle its route on the map</p>
          </div>

          <RouteComparisonCards
            results={comparisonResults}
            visibleModes={visibleModes}
            onToggleMode={toggleMode}
          />

          <RouteMap
            visibleModes={visibleModes}
            origin={origin}
            destination={destination}
          />

          <RouteSavingsSummary />
        </div>
      )}
    </div>
  );
}
