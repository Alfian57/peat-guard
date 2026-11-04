export const FIRMS_SOURCES = [
  "VIIRS_SNPP_NRT",
  "VIIRS_NOAA20_NRT",
  "VIIRS_NOAA21_NRT",
] as const;

export type FirmsSource = (typeof FIRMS_SOURCES)[number];

export const DEMO_HOTSPOT_SOURCE = "DEMO_VIIRS" as const;
