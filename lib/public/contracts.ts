import type { Polygon } from "geojson";

import type { FirmsSource } from "@/lib/firms-sources";
import type { MapViewport } from "@/lib/maps/types";

export type PublicMetrics = {
  approvedZoneCount: number;
  protectedAreaHectares: number;
  estimatedCarbonTons: number;
  estimatedIncentiveIdr: number;
  hotspotCount: number;
  containsIllustrativeData: boolean;
};

export type PublicHotspot = {
  coordinates: [longitude: number, latitude: number];
  source: FirmsSource | "DEMO_VIIRS";
  confidence: string | null;
  brightnessKelvin: number | null;
  acquiredAt: string;
  isDemoData: boolean;
};

export type PublicZone = {
  name: string;
  areaHectares: number;
  geometry: Polygon;
  isDemoData: boolean;
};

export type PublicMapFreshness = {
  provider: "NASA FIRMS";
  status: "fresh" | "stale" | "unavailable" | "not_configured";
  configured: boolean;
  checkedAt: string;
  lastSuccessfulAt: string | null;
  expectedIntervalMinutes: number;
};

export type PublicMapData = {
  generatedAt: string;
  viewport: MapViewport;
  period: "24h" | "7d" | "30d" | "all";
  source: PublicMapSourceFilter;
  confidence: PublicMapConfidenceFilter;
  zones: PublicZone[];
  hotspots: PublicHotspot[];
  truncated: {
    zones: boolean;
    hotspots: boolean;
  };
  freshness: PublicMapFreshness;
};

export type PublicMapSourceFilter = "all" | "demo" | FirmsSource;
export type PublicMapConfidenceFilter =
  "all" | "low" | "nominal" | "high" | "numeric" | "unknown";
