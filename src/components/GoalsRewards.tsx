import { useState } from "react";
import { Trophy, Target, Plus, Flame, Route as RouteIcon, Leaf, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  type: "distance" | "caloric" | "environmental";
  title: string;
  target: string;
  current: number;
  total: number;
  unit: string;
  reward: string;
  rewardCategory: "health" | "treats" | "equipment";
}

const goals: Goal[] = [
  {
    id: "1",
    type: "distance",
    title: "Century Rider",
    target: "Cycle 100 km this month",
    current: 74.3,
    total: 100,
    unit: "km",
    reward: "10% off at Pyöräpaja Helsinki",
    rewardCategory: "equipment",
  },
  {
    id: "2",
    type: "caloric",
    title: "Burn Machine",
    target: "Burn 5,000 kcal cycling",
    current: 3100,
    total: 5000,
    unit: "kcal",
    reward: "Free smoothie at Good Life Coffee",
    rewardCategory: "health",
  },
  {
    id: "3",
    type: "environmental",
    title: "Green Commuter",
    target: "Save 15 kg of CO₂",
    current: 10.4,
    total: 15,
    unit: "kg CO₂",
    reward: "€5 voucher at Fazer Café",
    rewardCategory: "treats",
  },
  {
    id: "4",
    type: "distance",
    title: "Weekly Warrior",
    target: "Cycle every weekday",
    current: 3,
    total: 5,
    unit: "days",
    reward: "Free HSL day ticket",
    rewardCategory: "treats",
  },
];

const typeConfig = {
  distance: { icon: RouteIcon, color: "text-primary", bg: "bg-primary", label: "Distance" },
  caloric: { icon: Flame, color: "text-calorie", bg: "bg-calorie", label: "Caloric" },
  environmental: { icon: Leaf, color: "text-eco", bg: "bg-eco", label: "Environmental" },
};

const categoryColors = {
  health: "bg-calorie/10 text-calorie",
  treats: "bg-accent/10 text-accent-foreground",
  equipment: "bg-primary/10 text-primary",
};

export default function GoalsRewards() {
  const [filter, setFilter] = useState<string>("all");
  const filters = ["all", "distance", "caloric", "environmental"];

  const filtered = filter === "all" ? goals : goals.filter((g) => g.type === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">Goals & Rewards</h3>
          <p className="text-sm text-muted-foreground">
            Complete cycling goals to earn rewards from local Helsinki businesses
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Custom Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((goal, i) => {
          const config = typeConfig[goal.type];
          const Icon = config.icon;
          const progress = Math.round((goal.current / goal.total) * 100);
          const isComplete = progress >= 100;

          return (
            <div
              key={goal.id}
              className={cn(
                "bg-card rounded-lg shadow-card p-5 animate-fade-in transition-all hover:shadow-elevated",
                isComplete && "border border-primary/30"
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg text-primary-foreground", config.bg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{goal.title}</h4>
                    <p className="text-xs text-muted-foreground">{goal.target}</p>
                  </div>
                </div>
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000", config.bg)}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {goal.current} / {goal.total} {goal.unit}
                </span>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", categoryColors[goal.rewardCategory])}>
                  🎁 {goal.reward}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Rewards */}
      <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <h3 className="font-semibold text-lg mb-1">🏆 Available Rewards</h3>
        <p className="text-sm text-muted-foreground mb-4">Earned from completed goals</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: "Pyöräpaja Helsinki", desc: "10% off bike tune-up", expires: "Dec 31", category: "equipment" as const },
            { title: "Good Life Coffee", desc: "Free smoothie", expires: "Nov 15", category: "health" as const },
            { title: "Fazer Café", desc: "€5 voucher", expires: "Jan 31", category: "treats" as const },
          ].map((reward, i) => (
            <div
              key={i}
              className="gradient-reward rounded-lg p-4 text-primary-foreground"
            >
              <p className="font-semibold text-sm">{reward.title}</p>
              <p className="text-xs opacity-90">{reward.desc}</p>
              <p className="text-xs opacity-75 mt-2">Expires: {reward.expires}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
