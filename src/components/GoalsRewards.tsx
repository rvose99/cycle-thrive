import { useState } from "react";
import { Trophy, Plus, Flame, Route as RouteIcon, Leaf, CheckCircle2 } from "lucide-react";
import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTrips, tripMode, type Trip } from "@/hooks/useTrips";

type GoalType = "distance" | "caloric" | "environmental";
type GoalMode = "all" | "cycling" | "walking";
type RewardCategory = "health" | "treats" | "equipment" | "profile";

interface Goal {
  id: string;
  type: GoalType;
  title: string;
  target: string;
  current: number;
  total: number;
  unit: string;
  reward: string;
  rewardCategory: RewardCategory;
}

interface CustomGoalSpec {
  id: string;
  type: GoalType;
  mode: GoalMode;
  total: number;
}

const MARATHON_KM = 42.195;

const typeConfig = {
  distance: { icon: RouteIcon, color: "text-primary", bg: "bg-primary", label: "Distance" },
  caloric: { icon: Flame, color: "text-calorie", bg: "bg-calorie", label: "Caloric" },
  environmental: { icon: Leaf, color: "text-eco", bg: "bg-eco", label: "Environmental" },
};

const categoryColors: Record<RewardCategory, string> = {
  health: "bg-calorie/10 text-calorie",
  treats: "bg-accent/10 text-accent-foreground",
  equipment: "bg-primary/10 text-primary",
  profile: "bg-competition/10 text-competition",
};

const filterOptions: Array<"all" | GoalType> = ["all", "distance", "caloric", "environmental"];

const modeLabels: Record<GoalMode, string> = {
  all: "all modes",
  cycling: "cycling",
  walking: "walking",
};

const isThisMonth = (date: string) => {
  const monthStart = startOfMonth(new Date());
  const tripDate = new Date(date);
  return tripDate >= monthStart;
};

const roundOne = (value: number) => Math.round(value * 10) / 10;

const filterTripsByMode = (trips: Trip[], mode: GoalMode) => {
  if (mode === "all") return trips;
  return trips.filter((trip) => tripMode(trip) === mode);
};

const sumDistanceKm = (trips: Trip[]) => roundOne(trips.reduce((sum, trip) => sum + trip.distance_m / 1000, 0));
const sumCalories = (trips: Trip[]) => Math.round(trips.reduce((sum, trip) => sum + trip.kcal, 0));
const sumCo2Kg = (trips: Trip[]) => roundOne(trips.reduce((sum, trip) => sum + trip.co2_saved_g / 1000, 0));

const getMovingStreakDays = (trips: Trip[]) => {
  let streak = 0;

  for (let i = 0; i < 7; i += 1) {
    const dayStr = format(addDays(new Date(), -i), "yyyy-MM-dd");
    const hasActiveTrip = trips.some(
      (trip) => trip.date === dayStr && ["cycling", "walking"].includes(tripMode(trip)),
    );

    if (!hasActiveTrip) break;
    streak += 1;
  }

  return streak;
};

const buildCustomGoal = (spec: CustomGoalSpec, monthlyTrips: Trip[]): Goal => {
  const relevantTrips = filterTripsByMode(monthlyTrips, spec.mode);
  const modeText = modeLabels[spec.mode];

  if (spec.type === "distance") {
    return {
      id: spec.id,
      type: spec.type,
      title: "Custom Distance",
      target: `Travel ${spec.total} km by ${modeText} this month`,
      current: sumDistanceKm(relevantTrips),
      total: spec.total,
      unit: "km",
      reward: "Custom profile badge",
      rewardCategory: "profile",
    };
  }

  if (spec.type === "caloric") {
    return {
      id: spec.id,
      type: spec.type,
      title: "Custom Calories",
      target: `Burn ${spec.total} kcal by ${modeText} this month`,
      current: sumCalories(relevantTrips),
      total: spec.total,
      unit: "kcal",
      reward: "Custom profile badge",
      rewardCategory: "profile",
    };
  }

  return {
    id: spec.id,
    type: spec.type,
    title: "Custom CO2 Saver",
    target: `Save ${spec.total} kg of CO2 by ${modeText} this month`,
    current: sumCo2Kg(relevantTrips),
    total: spec.total,
    unit: "kg CO2",
    reward: "Custom profile badge",
    rewardCategory: "profile",
  };
};

export default function GoalsRewards() {
  const [filter, setFilter] = useState<"all" | GoalType>("all");
  const [customOpen, setCustomOpen] = useState(false);
  const [customType, setCustomType] = useState<GoalType>("distance");
  const [customMode, setCustomMode] = useState<GoalMode>("cycling");
  const [customTarget, setCustomTarget] = useState("25");
  const [customGoals, setCustomGoals] = useState<CustomGoalSpec[]>([]);

  const { data: trips = [] } = useTrips();
  const monthlyTrips = trips.filter((trip) => isThisMonth(trip.date));
  const monthlyCyclingTrips = monthlyTrips.filter((trip) => tripMode(trip) === "cycling");
  const monthlyWalkingTrips = monthlyTrips.filter((trip) => tripMode(trip) === "walking");
  const monthlyActiveTrips = monthlyTrips.filter((trip) => ["cycling", "walking"].includes(tripMode(trip)));

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekdaysCycled = Array.from({ length: 5 }, (_, i) => {
    const dayStr = format(addDays(weekStart, i), "yyyy-MM-dd");
    return trips.some((trip) => trip.date === dayStr && tripMode(trip) === "cycling");
  }).filter(Boolean).length;

  const movingStreakDays = getMovingStreakDays(trips);

  const goals: Goal[] = [
    {
      id: "century-rider",
      type: "distance",
      title: "Century Rider",
      target: "Cycle 100 km this month",
      current: sumDistanceKm(monthlyCyclingTrips),
      total: 100,
      unit: "km",
      reward: "10% off at Pyöräpaja Helsinki",
      rewardCategory: "equipment",
    },
    {
      id: "burn-machine",
      type: "caloric",
      title: "Burn Machine",
      target: "Burn 5,000 kcal cycling",
      current: sumCalories(monthlyCyclingTrips),
      total: 5000,
      unit: "kcal",
      reward: "Free smoothie at Good Life Coffee",
      rewardCategory: "health",
    },
    {
      id: "green-commuter",
      type: "environmental",
      title: "Green Commuter",
      target: "Save 15 kg of CO2 by walking or cycling",
      current: sumCo2Kg(monthlyActiveTrips),
      total: 15,
      unit: "kg CO2",
      reward: "€5 voucher at Fazer Café",
      rewardCategory: "treats",
    },
    {
      id: "weekly-warrior",
      type: "distance",
      title: "Weekly Warrior",
      target: "Cycle every weekday",
      current: weekdaysCycled,
      total: 5,
      unit: "days",
      reward: "Free HSL day ticket",
      rewardCategory: "treats",
    },
    {
      id: "marathon-completed",
      type: "distance",
      title: "Marathon Completed?",
      target: "Walk a marathon's length this month",
      current: sumDistanceKm(monthlyWalkingTrips),
      total: MARATHON_KM,
      unit: "km",
      reward: "Recovery drink at Good Life Coffee",
      rewardCategory: "health",
    },
    {
      id: "i-love-moving",
      type: "caloric",
      title: "I Love Moving",
      target: "Log walking or cycling for a 1-week streak",
      current: movingStreakDays,
      total: 7,
      unit: "days",
      reward: "Ateneum 25% off voucher",
      rewardCategory: "treats",
    },
    ...customGoals.map((goal) => buildCustomGoal(goal, monthlyTrips)),
  ];

  const filtered = filter === "all" ? goals : goals.filter((goal) => goal.type === filter);

  const handleCreateCustomGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const total = Number(customTarget);

    if (!Number.isFinite(total) || total <= 0) return;

    setCustomGoals((current) => [
      ...current,
      {
        id: `custom-${crypto.randomUUID()}`,
        type: customType,
        mode: customMode,
        total,
      },
    ]);
    setCustomOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">Goals & Rewards</h3>
          <p className="text-sm text-muted-foreground">
            Complete mode-specific movement goals to earn rewards from local Helsinki businesses
          </p>
        </div>
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Custom Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Goal</DialogTitle>
              <DialogDescription>
                Pick a metric and count it for cycling, walking, or all logged modes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCustomGoal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-type">Metric</Label>
                <select
                  id="custom-type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={customType}
                  onChange={(event) => setCustomType(event.target.value as GoalType)}
                >
                  <option value="distance">Distance travelled</option>
                  <option value="caloric">Calories burned</option>
                  <option value="environmental">CO2 saved</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-mode">Mode</Label>
                <select
                  id="custom-mode"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={customMode}
                  onChange={(event) => setCustomMode(event.target.value as GoalMode)}
                >
                  <option value="cycling">Cycling</option>
                  <option value="walking">Walking</option>
                  <option value="all">All modes</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-target">
                  Target {customType === "distance" ? "(km)" : customType === "caloric" ? "(kcal)" : "(kg CO2)"}
                </Label>
                <Input
                  id="custom-target"
                  type="number"
                  min="1"
                  step={customType === "caloric" ? "1" : "0.1"}
                  value={customTarget}
                  onChange={(event) => setCustomTarget(event.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit">Generate Goal</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {filterOptions.map((option) => (
          <button
            key={option}
            onClick={() => setFilter(option)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors",
              filter === option
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {option}
          </button>
        ))}
      </div>

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
                isComplete && "border border-primary/30",
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

              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000", config.bg)}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {goal.current} / {goal.total} {goal.unit}
                </span>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full text-right", categoryColors[goal.rewardCategory])}>
                  Reward: {goal.reward}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-lg shadow-card p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <h3 className="font-semibold text-lg mb-1">Available Rewards</h3>
        <p className="text-sm text-muted-foreground mb-4">Earned from completed goals</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {goals
            .filter((goal) => goal.current >= goal.total)
            .map((goal) => (
              <div key={goal.id} className="gradient-reward rounded-lg p-4 text-primary-foreground">
                <p className="font-semibold text-sm">{goal.reward}</p>
                <p className="text-xs opacity-90">{goal.title}</p>
                <p className="text-xs opacity-75 mt-2">Unlocked this month</p>
              </div>
            ))}
          {goals.every((goal) => goal.current < goal.total) && (
            <p className="text-sm text-muted-foreground sm:col-span-3">No rewards unlocked yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
