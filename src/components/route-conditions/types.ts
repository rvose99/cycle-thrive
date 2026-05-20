export type ConditionRating = "good" | "mediocre" | "bad";
export type ReportType = "point" | "section";

export interface ConditionReport {
  id: string;
  userId?: string;
  type: ReportType;
  rating: ConditionRating;
  reason: string;
  description: string;
  timestamp: Date;
  // For point reports
  point?: [number, number];
  // For section reports
  sectionStart?: [number, number];
  sectionEnd?: [number, number];
  sectionCoords?: [number, number][];
}

export const ratingColors: Record<ConditionRating, string> = {
  good: "hsl(168, 72%, 36%)",
  mediocre: "hsl(36, 90%, 55%)",
  bad: "hsl(0, 72%, 51%)",
};

export const ratingLabels: Record<ConditionRating, string> = {
  good: "Good",
  mediocre: "Mediocre",
  bad: "Bad",
};

export const faultReasons = [
  "Pothole",
  "Cracked surface",
  "Flooding / standing water",
  "Ice / snow",
  "Debris / obstruction",
  "Poor lighting",
  "Missing signage",
  "Narrow path",
  "Vegetation overgrowth",
  "Construction work",
  "Other",
] as const;
