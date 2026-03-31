import { Trophy, Medal, TrendingUp, Users, Crown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const leaderboard = [
  { rank: 1, name: "Mikko S.", distance: "342 km", co2: "48 kg", points: 2840, avatar: "MS" },
  { rank: 2, name: "Anna L.", distance: "298 km", co2: "42 kg", points: 2560, avatar: "AL" },
  { rank: 3, name: "Joonas K.", distance: "276 km", co2: "39 kg", points: 2310, avatar: "JK" },
  { rank: 4, name: "You", distance: "234 km", co2: "33 kg", points: 1940, avatar: "YO", isUser: true },
  { rank: 5, name: "Liisa P.", distance: "212 km", co2: "30 kg", points: 1780, avatar: "LP" },
  { rank: 6, name: "Tomi H.", distance: "189 km", co2: "27 kg", points: 1620, avatar: "TH" },
];

const companies = [
  { rank: 1, name: "Reaktor", employees: 48, totalKm: "4,320 km", avgPerEmployee: "90 km" },
  { rank: 2, name: "Supercell", employees: 35, totalKm: "3,150 km", avgPerEmployee: "90 km" },
  { rank: 3, name: "Wolt", employees: 62, totalKm: "4,960 km", avgPerEmployee: "80 km" },
];

const rankStyle = (rank: number) => {
  if (rank === 1) return "text-accent";
  if (rank === 2) return "text-muted-foreground";
  if (rank === 3) return "text-amber-700";
  return "text-muted-foreground";
};

export default function Competition() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">Competition</h3>
        <p className="text-sm text-muted-foreground">
          Compete with friends and colleagues across Helsinki
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Individual Leaderboard */}
        <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-5 w-5 text-accent" />
            <h4 className="font-semibold">Monthly Leaderboard</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">October 2025 • Helsinki Region</p>
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.rank}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors animate-fade-in",
                  entry.isUser ? "bg-primary/5 border border-primary/20" : "hover:bg-secondary/50"
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className={cn("text-lg font-bold w-6 text-center", rankStyle(entry.rank))}>
                  {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                </span>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {entry.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", entry.isUser && "text-primary")}>
                    {entry.name}
                    {entry.isUser && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.distance} • {entry.co2} CO₂ saved</p>
                </div>
                <span className="text-sm font-bold font-mono">{entry.points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Company Challenge */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-competition" />
              <h4 className="font-semibold">Company Challenge</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Which Helsinki company cycles the most?</p>
            <div className="space-y-3">
              {companies.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30" >
                  <span className="text-lg font-bold w-6 text-center">
                    {["🥇", "🥈", "🥉"][i]}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.employees} cyclists • {c.avgPerEmployee} avg/person
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono">{c.totalKm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Year-End Preview */}
          <div className="gradient-hero rounded-lg p-6 text-primary-foreground animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5" />
              <h4 className="font-semibold">2025 Year-End Wrap-Up</h4>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Your cycling year in review is coming in December. Track your progress and see how you compare!
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Distance", value: "1,842 km" },
                { label: "CO₂ Saved", value: "258 kg" },
                { label: "Money Saved", value: "€724" },
              ].map((stat) => (
                <div key={stat.label} className="bg-primary-foreground/10 rounded-lg p-3 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs opacity-80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
