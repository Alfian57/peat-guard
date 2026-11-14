import {
  Popup,
  type LngLatBoundsLike,
  type Map as MapLibreMap,
} from "maplibre-gl";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";

import type { MapPoint, MapZone } from "@/lib/maps/types";

export const ZONES_SOURCE_ID = "peatguard-approved-zones";
export const POINTS_SOURCE_ID = "peatguard-public-points";

export type ZoneProperties = {
  id: string;
  name: string;
  areaHectares: number;
  isDemoData: boolean;
};

export type PointProperties = {
  id: string;
  label: string;
  description: string;
  kind: MapPoint["kind"];
  urgency: MapPoint["urgency"] | "";
  reportPinState: MapPoint["reportPinState"] | "";
  source: string;
  isDemoData: boolean;
};

export type ZoneFeature = Feature<Polygon, ZoneProperties>;
export type PointFeature = Feature<Point, PointProperties>;

export function toZoneCollection(
  zones: MapZone[],
): FeatureCollection<Polygon, ZoneProperties> {
  return {
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature",
      id: zone.id,
      properties: {
        id: zone.id,
        name: zone.name,
        areaHectares: zone.areaHectares,
        isDemoData: zone.isDemoData ?? false,
      },
      geometry: zone.geometry,
    })),
  };
}

export function toPointCollection(
  points: MapPoint[],
): FeatureCollection<Point, PointProperties> {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      id: point.id,
      properties: {
        id: point.id,
        label: point.label,
        description: point.description ?? "",
        kind: point.kind,
        urgency: point.urgency ?? "",
        reportPinState: point.reportPinState ?? "",
        source: point.source ?? "",
        isDemoData: point.isDemoData ?? false,
      },
      geometry: {
        type: "Point",
        coordinates: point.coordinates,
      },
    })),
  };
}

export function fitBoundsForData(
  zones: MapZone[],
  points: MapPoint[],
): LngLatBoundsLike | null {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  let hasCoordinates = false;

  const includeCoordinate = (longitude: number, latitude: number) => {
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
    hasCoordinates = true;
  };

  for (const point of points) {
    includeCoordinate(point.coordinates[0], point.coordinates[1]);
  }
  for (const zone of zones) {
    for (const ring of zone.geometry.coordinates) {
      for (const coordinate of ring) {
        includeCoordinate(coordinate[0], coordinate[1]);
      }
    }
  }

  if (!hasCoordinates) {
    return null;
  }

  return [
    [west, south],
    [east, north],
  ];
}

export function addMapPopup(
  map: MapLibreMap,
  coordinates: [number, number],
  title: string,
  detail: string,
) {
  const content = document.createElement("div");
  const heading = document.createElement("strong");
  const description = document.createElement("p");

  heading.textContent = title;
  description.className = "peatguard-map-popup-detail";
  description.textContent = detail;
  content.append(heading, description);

  new Popup({ closeButton: true, maxWidth: "260px", offset: 12 })
    .setLngLat(coordinates)
    .setDOMContent(content)
    .addTo(map);
}
