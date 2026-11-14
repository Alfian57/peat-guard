import {
  DEMO_HOTSPOT_SOURCE,
  FIRMS_SOURCES,
  type FirmsSource,
} from "@/lib/firms-sources";

export const FIRMS_HOTSPOT_SOURCE_LABELS: Record<
  FirmsSource | typeof DEMO_HOTSPOT_SOURCE,
  string
> = {
  [DEMO_HOTSPOT_SOURCE]: "Ilustrasi sintetis",
  VIIRS_SNPP_NRT: "NASA FIRMS · VIIRS SNPP",
  VIIRS_NOAA20_NRT: "NASA FIRMS · VIIRS NOAA-20",
  VIIRS_NOAA21_NRT: "NASA FIRMS · VIIRS NOAA-21",
};

export const FIRMS_HOTSPOT_CONFIDENCE_LABELS = {
  low: "Rendah",
  nominal: "Menengah",
  high: "Tinggi",
  numeric: "Nilai numerik",
  unknown: "Tidak tersedia",
} as const;

export function hotspotSourceLabel(source: string): string {
  if (source === DEMO_HOTSPOT_SOURCE) {
    return FIRMS_HOTSPOT_SOURCE_LABELS[DEMO_HOTSPOT_SOURCE];
  }

  const firmsSource = FIRMS_SOURCES.find((candidate) => candidate === source);
  return firmsSource
    ? FIRMS_HOTSPOT_SOURCE_LABELS[firmsSource]
    : `Sumber tidak dikenal: ${source}`;
}

export function hotspotConfidenceLabel(confidence: string | null): string {
  if (confidence === null || confidence === "") {
    return FIRMS_HOTSPOT_CONFIDENCE_LABELS.unknown;
  }

  if (/^\d+$/.test(confidence)) {
    return `${FIRMS_HOTSPOT_CONFIDENCE_LABELS.numeric}: ${confidence}`;
  }

  if (
    confidence === "high" ||
    confidence === "nominal" ||
    confidence === "low"
  ) {
    return FIRMS_HOTSPOT_CONFIDENCE_LABELS[confidence];
  }

  return `Nilai lain: ${confidence}`;
}
