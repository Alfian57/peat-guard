import type { Polygon } from "geojson";

import { FIRMS_SOURCES } from "@/lib/firms-sources";
import type { FirmsIngestSource, FirmsSource } from "@/lib/firms-sources";
import type { MapViewport } from "@/lib/maps/types";
import type { FirmsFreshnessStatus } from "@/lib/server/firms/status";

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
  status: FirmsFreshnessStatus;
  configured: boolean;
  checkedAt: string;
  lastSuccessfulAt: string | null;
  lastDataSyncAt: string | null;
  failedSources: FirmsIngestSource[];
  expectedIntervalMinutes: number | null;
};

export type PublicMapData = {
  generatedAt: string;
  viewport: MapViewport;
  period: PublicMapPeriod;
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

export const PUBLIC_MAP_PERIODS = ["24h", "7d", "30d", "all"] as const;
export const PUBLIC_MAP_SOURCES = ["all", "demo", ...FIRMS_SOURCES] as const;
export const PUBLIC_MAP_CONFIDENCE_FILTERS = [
  "all",
  "low",
  "nominal",
  "high",
  "numeric",
  "unknown",
] as const;

export type PublicMapPeriod = (typeof PUBLIC_MAP_PERIODS)[number];
export type PublicMapSourceFilter = (typeof PUBLIC_MAP_SOURCES)[number];
export type PublicMapConfidenceFilter =
  (typeof PUBLIC_MAP_CONFIDENCE_FILTERS)[number];
