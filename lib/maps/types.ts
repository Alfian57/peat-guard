import type { Polygon } from "geojson";

export type MapPointKind = "hotspot" | "water" | "report";

export type MapViewport = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type MapUrgency = "KRITIS" | "WASPADA" | "RENDAH";
export type ReportPinState = "critical" | "warning" | "safe" | "neutral";

export type MapPoint = {
  id: string;
  coordinates: [longitude: number, latitude: number];
  kind: MapPointKind;
  label: string;
  description?: string;
  urgency?: MapUrgency;
  reportPinState?: ReportPinState;
  source?: string;
  isDemoData?: boolean;
};

export type MapZone = {
  id: string;
  name: string;
  areaHectares: number;
  geometry: Polygon;
  isDemoData?: boolean;
};
