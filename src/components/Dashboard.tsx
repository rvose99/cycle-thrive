import { Bike, Route, Trophy, Gift, Users, BarChart3, MapPin, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  colorClass?: string;
  delay?: number;
}

const StatCard = ({ icon, label, value, subtext, colorClass = "bg-primary", delay = 0 }: StatCardProps) => (
  <div
    className="rounded-lg bg-card shadow-card p-5 flex items-start gap-4 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={cn("rounded-lg p-2.5 text-primary-foreground", colorClass)}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  </div>
);

const weeklyData = [
  { day: "Mon", km: 8.2 },
  { day: "Tue", km: 12.5 },
  { day: "Wed", km: 0 },
  { day: "Thu", km: 15.1 },
  { day: "Fri", km: 6.8 },
  { day: "Sat", km: 22.3 },
  { day: "Sun", km: 9.4 },
];

const maxKm = Math.max(...weeklyData.map((d) => d.km));

const recentRides = [
  { from: "Kallio", to: "Otaniemi", distance: "12.4 km", saved: "€3.20", co2: "1.8 kg" },
  { from: "Kamppi", to: "Herttoniemi", distance: "8.7 km", saved: "€2.10", co2: "1.2 kg" },
  { from: "Pasila", to: "Lauttasaari", distance: "6.3 km", saved: "€1.80", co2: "0.9 kg" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Bike className="h-5 w-5" />}
          label="Distance This Week"
          value="74.3 km"
          subtext="+12% from last week"
          colorClass="bg-primary"
          delay={0}
        />
        <StatCard
          icon={<Leaf className="h-5 w-5" />}
          label="CO₂ Saved"
          value="10.4 kg"
          subtext="Equivalent to 2 trees/month"
          colorClass="bg-eco"
          delay={100}
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Money Saved"
          value="€18.50"
          subtext="vs. HSL monthly pass"
          colorClass="bg-accent"
          delay={200}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Reward Points"
          value="1,240"
          subtext="3 rewards available"
          colorClass="bg-competition"
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h3 className="font-semibold text-lg mb-1">Weekly Activity</h3>
          <p className="text-sm text-muted-foreground mb-6">Your cycling distance this week</p>
          <div className="flex items-end gap-3 h-44">
            {weeklyData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {d.km > 0 ? `${d.km}` : "–"}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all duration-700",
                    d.km > 0 ? "gradient-hero" : "bg-muted"
                  )}
                  style={{ height: `${d.km > 0 ? (d.km / maxKm) * 100 : 8}%` }}
                />
                <span className="text-xs font-medium text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h3 className="font-semibold text-lg mb-1">Active Goals</h3>
          <p className="text-sm text-muted-foreground mb-5">This month's progress</p>
          <div className="space-y-5">
            {[
              { label: "100 km distance", progress: 74, color: "bg-primary" },
              { label: "5,000 kcal burned", progress: 62, color: "bg-calorie" },
              { label: "15 kg CO₂ saved", progress: 69, color: "bg-eco" },
            ].map((goal) => (
              <div key={goal.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{goal.label}</span>
                  <span className="text-muted-foreground">{goal.progress}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000", goal.color)}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Rides */}
      <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <h3 className="font-semibold text-lg mb-1">Recent Rides</h3>
        <p className="text-sm text-muted-foreground mb-4">Your latest cycling trips in Helsinki</p>
        <div className="space-y-3">
          {recentRides.map((ride, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {ride.from} → {ride.to}
                  </p>
                  <p className="text-xs text-muted-foreground">{ride.distance}</p>
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-sm font-semibold text-accent">{ride.saved}</p>
                  <p className="text-xs text-muted-foreground">saved</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-eco">{ride.co2}</p>
                  <p className="text-xs text-muted-foreground">CO₂</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
