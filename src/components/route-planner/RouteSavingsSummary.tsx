export default function RouteSavingsSummary() {
  return (
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
  );
}
