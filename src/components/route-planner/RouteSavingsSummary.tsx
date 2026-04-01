interface RouteSavingsSummaryProps {
  monthlySavingsEur: number;
  co2AvoidedKgPerMonth: number;
  caloriesPerMonth: number;
  timeDiffMinPerTrip: number; // positive = cycling is slower than car
}

export default function RouteSavingsSummary({
  monthlySavingsEur,
  co2AvoidedKgPerMonth,
  caloriesPerMonth,
  timeDiffMinPerTrip,
}: RouteSavingsSummaryProps) {
  const timeDiffLabel =
    timeDiffMinPerTrip > 0
      ? `+${timeDiffMinPerTrip} min/trip`
      : timeDiffMinPerTrip < 0
      ? `${timeDiffMinPerTrip} min/trip`
      : "Same time";

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
      <h4 className="font-semibold mb-2">💡 By cycling this route daily</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Monthly savings</p>
          <p className="text-lg font-bold text-accent">€{monthlySavingsEur.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">CO₂ avoided</p>
          <p className="text-lg font-bold text-eco">{co2AvoidedKgPerMonth} kg</p>
        </div>
        <div>
          <p className="text-muted-foreground">Calories burned</p>
          <p className="text-lg font-bold text-calorie">{caloriesPerMonth.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Time difference</p>
          <p className="text-lg font-bold text-foreground">{timeDiffLabel}</p>
        </div>
      </div>
    </div>
  );
}
