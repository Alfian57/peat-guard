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
  const coordinates: [number, number][] = points.map(
    (point) => point.coordinates,
  );

  for (const zone of zones) {
    for (const ring of zone.geometry.coordinates) {
      for (const coordinate of ring) {
        coordinates.push([coordinate[0], coordinate[1]]);
      }
    }
  }

  if (coordinates.length === 0) {
    return null;
  }

  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);

  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
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
