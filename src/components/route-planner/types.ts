import { ReactNode } from "react";

export const bikeTypes = ["City Bike", "E-Bike", "Road Bike", "HSL City Bike"] as const;
export const tripTypes = ["Regular", "With Children", "Minimal Activity", "Cargo"] as const;

export interface ComparisonData {
  mode: string;
  icon: ReactNode;
  time: string;
  cost: string;
  co2: string;
  kcal: string;
  color: string;
  highlight?: boolean;
}

export interface RouteCoords {
  lat: number;
  lng: number;
}

export interface RouteData {
  mode: string;
  color: string;
  coordinates: [number, number][];
}
