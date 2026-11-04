import {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapMouseEvent,
} from "maplibre-gl";

import {
  addMapPopup,
  POINTS_SOURCE_ID,
  type PointFeature,
  type ZoneFeature,
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
    "peatguard-zone-fill",
    ...(clustersEnabled ? ["peatguard-clusters"] : []),
    "peatguard-points",
  ];

  if (clustersEnabled) {
    map.on("click", "peatguard-clusters", async (event) => {
      if (isDraftEditing()) {
        return;
      }

      const feature = event.features?.[0];
      const clusterId = feature?.properties?.cluster_id;
      const pointSource = map.getSource(POINTS_SOURCE_ID) as
        GeoJSONSource | undefined;

      if (!feature || typeof clusterId !== "number" || !pointSource) {
        return;
      }

      try {
        const expansionZoom =
          await pointSource.getClusterExpansionZoom(clusterId);

        if (isDraftEditing()) {
          return;
        }

        if (feature.geometry.type === "Point") {
          map.easeTo({
            center: feature.geometry.coordinates as [number, number],
            zoom: expansionZoom,
          });
        }
      } catch {
        // The map can be removed while the cluster expansion request is pending.
      }
    });
  }

  map.on("click", "peatguard-points", (event) => {
    if (isDraftEditing()) {
      return;
    }

    const feature = event.features?.[0] as PointFeature | undefined;

    if (!feature) {
      return;
    }

    const properties = feature.properties;
    const point: MapPoint = {
      id: properties.id,
      coordinates: [
        feature.geometry.coordinates[0],
        feature.geometry.coordinates[1],
      ],
      kind: properties.kind,
      label: properties.label,
      description: properties.description,
      urgency: properties.urgency || undefined,
      source: properties.source || undefined,
      isDemoData: properties.isDemoData,
    };

    handlers.onPointSelect?.(point);
    addMapPopup(map, point.coordinates, point.label, point.description ?? "");
  });

  map.on("click", "peatguard-zone-fill", (event) => {
    if (isDraftEditing()) {
      return;
    }

    const feature = event.features?.[0] as ZoneFeature | undefined;

    if (!feature) {
      return;
    }

    const zone: MapZone = {
      id: feature.properties.id,
      name: feature.properties.name,
      areaHectares: feature.properties.areaHectares,
      isDemoData: feature.properties.isDemoData,
      geometry: feature.geometry,
    };
    const coordinates = [event.lngLat.lng, event.lngLat.lat] as [
      number,
      number,
    ];
    const hectares = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(zone.areaHectares);

    handlers.onZoneSelect?.(zone);
    addMapPopup(
      map,
      coordinates,
      zone.name,
      `${hectares} ha${zone.isDemoData ? " · data ilustrasi" : ""}`,
    );
  });

  for (const layerId of [
    ...(clustersEnabled ? ["peatguard-clusters"] : []),
    "peatguard-points",
    "peatguard-zone-fill",
  ]) {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = isDraftEditing() ? "crosshair" : "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }

  map.on("click", (event: MapMouseEvent) => {
    if (isDraftEditing()) {
      handlers.onMapClick?.([event.lngLat.lng, event.lngLat.lat]);
      return;
    }

    const features = map.queryRenderedFeatures(event.point, {
      layers: interactiveLayers,
    });

    if (features.length === 0) {
      handlers.onMapClick?.([event.lngLat.lng, event.lngLat.lat]);
    }
  });
}
