import type { Map as MapLibreMap } from "maplibre-gl";

import {
  POINTS_SOURCE_ID,
  toPointCollection,
  toZoneCollection,
  ZONES_SOURCE_ID,
} from "@/components/maps/map-data";
import type { MapPoint, MapZone } from "@/lib/maps/types";

export const NEUTRAL_REPORT_PIN_COLOR = "#64748b";

const REPORT_PIN_COLOR_MATCHES = [
  "critical",
  "#dc2626",
  "warning",
  "#d97706",
  "safe",
  "#047857",
] as const;

export function addMapLayers(
  map: MapLibreMap,
  zones: MapZone[],
  points: MapPoint[],
  clusterPoints = true,
) {
  map.addSource(ZONES_SOURCE_ID, {
    type: "geojson",
    data: toZoneCollection(zones),
  });
  map.addSource(POINTS_SOURCE_ID, {
    type: "geojson",
    data: toPointCollection(points),
    cluster: clusterPoints,
    clusterMaxZoom: 13,
    clusterRadius: 42,
  });

  map.addLayer({
    id: "peatguard-zone-fill",
    type: "fill",
    source: ZONES_SOURCE_ID,
    paint: {
      "fill-color": [
        "case",
        ["boolean", ["get", "isDemoData"], false],
        "#f6b84a",
        "#4b8a46",
      ],
      "fill-opacity": 0.2,
    },
  });
  map.addLayer({
    id: "peatguard-zone-outline",
    type: "line",
    source: ZONES_SOURCE_ID,
    paint: {
      "line-color": [
        "case",
        ["boolean", ["get", "isDemoData"], false],
        "#f6b84a",
        "#9bb85a",
      ],
      "line-width": 2,
    },
  });
  if (clusterPoints) {
    map.addLayer({
      id: "peatguard-clusters",
      type: "circle",
      source: POINTS_SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#f6b84a",
        "circle-radius": ["step", ["get", "point_count"], 15, 10, 19, 40, 23],
        "circle-stroke-color": "#1f4d3d",
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: "peatguard-cluster-count",
      type: "symbol",
      source: POINTS_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
      paint: { "text-color": "#1f4d3d" },
    });
  }
  map.addLayer({
    id: "peatguard-points",
    type: "circle",
    source: POINTS_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": [
        "case",
        ["==", ["get", "kind"], "water"],
        "#1473b8",
        ["==", ["get", "kind"], "report"],
        [
          "match",
          ["get", "reportPinState"],
          ...REPORT_PIN_COLOR_MATCHES,
          NEUTRAL_REPORT_PIN_COLOR,
        ],
        ["boolean", ["get", "isDemoData"], false],
        "#f6b84a",
        "#dc5a1b",
      ],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 4, 12, 7],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });
}
