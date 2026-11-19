import {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapMouseEvent,
} from "maplibre-gl";

import {
  addMapPopup,
  POINTS_SOURCE_ID,
  type PointProperties,
  type ZoneProperties,
} from "@/components/maps/map-data";
import type { MapPoint, MapZone } from "@/lib/maps/types";

type MapInteractionHandlers = {
  isDraftEditing?: () => boolean;
  onMapClick?: (coordinates: [longitude: number, latitude: number]) => void;
  onPointSelect?: (point: MapPoint) => void;
  onZoneSelect?: (zone: MapZone) => void;
};

export function addMapInteractions(
  map: MapLibreMap,
  handlers: MapInteractionHandlers,
  clustersEnabled = true,
) {
  const isDraftEditing = handlers.isDraftEditing ?? (() => false);
  const interactiveLayers = [
    "peatguard-points",
    ...(clustersEnabled ? ["peatguard-clusters"] : []),
    "peatguard-zone-fill",
  ];
  let popup: ReturnType<typeof addMapPopup> | undefined;
  let latestClick = 0;

  map.on("click", async (event: MapMouseEvent) => {
    const click = ++latestClick;
    popup?.remove();
    popup = undefined;

    const coordinates: [number, number] = [event.lngLat.lng, event.lngLat.lat];
    if (isDraftEditing()) {
      handlers.onMapClick?.(coordinates);
      return;
    }

    const layers = interactiveLayers.filter((layer) => map.getLayer(layer));
    // MapLibre returns the topmost feature first, including where layers overlap.
    const [feature] = layers.length
      ? map.queryRenderedFeatures(event.point, { layers })
      : [];

    if (!feature) {
      handlers.onMapClick?.(coordinates);
      return;
    }

    const { geometry } = feature;
    const layer = feature.layer.id;

    if (layer === "peatguard-clusters" && geometry.type === "Point") {
      const clusterId = feature.properties.cluster_id;
      const pointSource = map.getSource<GeoJSONSource>(POINTS_SOURCE_ID);

      if (typeof clusterId !== "number" || !pointSource) {
        return;
      }

      try {
        const expansionZoom =
          await pointSource.getClusterExpansionZoom(clusterId);

        if (
          click !== latestClick ||
          isDraftEditing() ||
          map.getSource(POINTS_SOURCE_ID) !== pointSource
        ) {
          return;
        }

        map.easeTo({
          center: [geometry.coordinates[0], geometry.coordinates[1]],
          zoom: expansionZoom,
        });
      } catch {
        // The map can be removed while the cluster expansion request is pending.
      }
      return;
    }

    if (layer === "peatguard-points" && geometry.type === "Point") {
      const properties = feature.properties as PointProperties;
      const point: MapPoint = {
        id: properties.id,
        coordinates: [geometry.coordinates[0], geometry.coordinates[1]],
        kind: properties.kind,
        label: properties.label,
        description: properties.description,
        urgency: properties.urgency || undefined,
        source: properties.source || undefined,
        isDemoData: properties.isDemoData,
      };

      handlers.onPointSelect?.(point);
      popup = addMapPopup(
        map,
        point.coordinates,
        point.label,
        point.description ?? "",
      );
      return;
    }

    if (layer === "peatguard-zone-fill") {
      const properties = feature.properties as ZoneProperties;
      const zone: MapZone = {
        ...properties,
        geometry: geometry as MapZone["geometry"],
      };
      const hectares = new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
      }).format(zone.areaHectares);

      handlers.onZoneSelect?.(zone);
      popup = addMapPopup(
        map,
        coordinates,
        zone.name,
        `${hectares} ha${zone.isDemoData ? " · data ilustrasi" : ""}`,
      );
    }
  });

  for (const layerId of interactiveLayers) {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = isDraftEditing() ? "crosshair" : "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}
