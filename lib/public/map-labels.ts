import { DEMO_HOTSPOT_SOURCE } from "@/lib/firms-sources";
import {
  FIRMS_HOTSPOT_CONFIDENCE_LABELS,
  FIRMS_HOTSPOT_SOURCE_LABELS,
} from "@/lib/firms-labels";
import type {
  PublicMapConfidenceFilter,
  PublicMapSourceFilter,
} from "@/lib/public/contracts";

export const PUBLIC_MAP_SOURCE_LABELS: Record<PublicMapSourceFilter, string> = {
  all: "Semua sumber",
  demo: FIRMS_HOTSPOT_SOURCE_LABELS[DEMO_HOTSPOT_SOURCE],
  VIIRS_SNPP_NRT: FIRMS_HOTSPOT_SOURCE_LABELS.VIIRS_SNPP_NRT,
  VIIRS_NOAA20_NRT: FIRMS_HOTSPOT_SOURCE_LABELS.VIIRS_NOAA20_NRT,
  VIIRS_NOAA21_NRT: FIRMS_HOTSPOT_SOURCE_LABELS.VIIRS_NOAA21_NRT,
};

export const PUBLIC_MAP_CONFIDENCE_LABELS: Record<
  PublicMapConfidenceFilter,
  string
> = {
  all: "Semua tingkat",
  low: FIRMS_HOTSPOT_CONFIDENCE_LABELS.low,
  nominal: FIRMS_HOTSPOT_CONFIDENCE_LABELS.nominal,
  high: FIRMS_HOTSPOT_CONFIDENCE_LABELS.high,
  numeric: FIRMS_HOTSPOT_CONFIDENCE_LABELS.numeric,
  unknown: FIRMS_HOTSPOT_CONFIDENCE_LABELS.unknown,
};
