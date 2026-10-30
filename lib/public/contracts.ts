import type { MapPoint, MapZone } from "@/lib/maps/types";

export type PublicMetrics = {
  approvedZoneCount: number;
  protectedAreaHectares: number;
  estimatedCarbonTons: number;
  estimatedIncentiveIdr: number;
  hotspotCount: number;
  containsIllustrativeData: boolean;
};

export type PublicMapData = {
  zones: MapZone[];
  hotspots: MapPoint[];
};
