"use client";

import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import {
  POINTS_SOURCE_ID,
  toPointCollection,
  toZoneCollection,
  ZONES_SOURCE_ID,
  fitBoundsForData,
} from "@/components/maps/map-data";
import {
  MapConfigurationState,
  MapMessageState,
} from "@/components/maps/map-message-state";
import { addMapInteractions } from "@/components/maps/map-interactions";
import { addMapLayers } from "@/components/maps/map-layers";
import type { MapPoint, MapViewport, MapZone } from "@/lib/maps/types";

if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre-gl-worker.mjs");
}

const DEFAULT_CENTER: [number, number] = [113.9, -2.01];
const DEFAULT_ZOOM = 6.5;
const DEFAULT_MAX_AUTOFIT_ZOOM = 6.5;

const FALLBACK_BASEMAP_STYLE = {
  version: 8 as const,
  sources: {
    "osm-tiles": {
      type: "raster" as const,
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster" as const,
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

type MapData = {
  zones: MapZone[];
  points: MapPoint[];
};

export type MapCanvasProps = {
  zones: MapZone[];
  points: MapPoint[];
  className?: string;
  interactive?: boolean;
  clusterPoints?: boolean;
  autoFit?: boolean;
  maxAutoFitZoom?: number;
  initialCenter?: [longitude: number, latitude: number];
  initialZoom?: number;
  onMapClick?: (coordinates: [longitude: number, latitude: number]) => void;
  draftEditing?: boolean;
  onViewportChange?: (viewport: MapViewport) => void;
  onPointSelect?: (point: MapPoint) => void;
  onZoneSelect?: (zone: MapZone) => void;
};

export default function MapCanvas({
  zones,
  points,
  className,
  interactive = true,
  clusterPoints = true,
  autoFit = true,
  maxAutoFitZoom = DEFAULT_MAX_AUTOFIT_ZOOM,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  onMapClick,
  draftEditing = false,
  onViewportChange,
  onPointSelect,
  onZoneSelect,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const draftEditingRef = useRef(draftEditing);
  const onViewportChangeRef = useRef(onViewportChange);
  const onPointSelectRef = useRef(onPointSelect);
  const onZoneSelectRef = useRef(onZoneSelect);
  const latestDataRef = useRef<MapData>({ zones, points });
  const clusterPointsRef = useRef(clusterPoints);
  const autoFitRef = useRef(autoFit);
  const maxAutoFitZoomRef = useRef(maxAutoFitZoom);
  const initialCenterRef = useRef(initialCenter);
  const initialZoomRef = useRef(initialZoom);
  const loadedRef = useRef(false);
  const hasFitBoundsRef = useRef(false);
  const [mapIsReady, setMapIsReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    draftEditingRef.current = draftEditing;
    onViewportChangeRef.current = onViewportChange;
    onPointSelectRef.current = onPointSelect;
    onZoneSelectRef.current = onZoneSelect;
    clusterPointsRef.current = clusterPoints;
    autoFitRef.current = autoFit;
    maxAutoFitZoomRef.current = maxAutoFitZoom;
    initialCenterRef.current = initialCenter;
    initialZoomRef.current = initialZoom;
  }, [
    autoFit,
    clusterPoints,
    draftEditing,
    initialCenter,
    initialZoom,
    maxAutoFitZoom,
    onMapClick,
    onPointSelect,
    onViewportChange,
    onZoneSelect,
  ]);

  useEffect(() => {
    latestDataRef.current = { zones, points };
  }, [points, zones]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !mapTilerKey) {
      return;
    }

    let disposed = false;
    hasFitBoundsRef.current = false;
    const map = new MapLibreMap({
      container,
      style:
        "https://api.maptiler.com/maps/streets-v2/style.json?key=" +
        encodeURIComponent(mapTilerKey),
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      cooperativeGestures: true,
      interactive,
      maxZoom: 17,
      minZoom: 4,
    });

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const publishViewport = () => {
      const bounds = map.getBounds();
      onViewportChangeRef.current?.({
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      });
    };
    map.on("moveend", publishViewport);

    let isRecoveringWithFallback = false;

    const initializeMapLayers = () => {
      if (disposed || loadedRef.current) {
        return;
      }

      setMapError(false);
      const currentData = latestDataRef.current;
      addMapLayers(
        map,
        currentData.zones,
        currentData.points,
        clusterPointsRef.current,
      );

      const bounds = autoFitRef.current
        ? fitBoundsForData(currentData.zones, currentData.points)
        : null;

      if (bounds) {
        map.fitBounds(bounds, {
          padding: 44,
          maxZoom: maxAutoFitZoomRef.current,
          duration: 0,
        });
        hasFitBoundsRef.current = true;
      }

      publishViewport();

      addMapInteractions(
        map,
        {
          isDraftEditing: () => draftEditingRef.current,
          onMapClick: (coordinates) => onMapClickRef.current?.(coordinates),
          onPointSelect: (point) => onPointSelectRef.current?.(point),
          onZoneSelect: (zone) => onZoneSelectRef.current?.(zone),
        },
        clusterPointsRef.current,
      );

      loadedRef.current = true;
      setMapIsReady(true);
    };

    map.once("load", initializeMapLayers);

    map.on("error", () => {
      if (disposed) {
        return;
      }

      // If the primary basemap fails (e.g. MapTiler 403 origin restrictions or network failure),
      // gracefully fall back to OpenStreetMap raster tiles so zones and hotspots remain fully interactive.
      if (!loadedRef.current && !isRecoveringWithFallback) {
        isRecoveringWithFallback = true;
        map.setStyle(FALLBACK_BASEMAP_STYLE, { diff: false });
        map.once("style.load", initializeMapLayers);
        return;
      }

      if (!loadedRef.current) {
        loadedRef.current = true;
        setMapError(true);
        map.remove();
        mapRef.current = null;
      }
    });

    return () => {
      disposed = true;
      loadedRef.current = false;
      hasFitBoundsRef.current = false;
      map.remove();
      mapRef.current = null;
      setMapIsReady(false);
    };
  }, [clusterPoints, interactive, mapTilerKey]);

  useEffect(() => {
    if (!mapIsReady || !mapRef.current) {
      return;
    }

    const zoneSource = mapRef.current.getSource(ZONES_SOURCE_ID) as
      GeoJSONSource | undefined;
    const pointSource = mapRef.current.getSource(POINTS_SOURCE_ID) as
      GeoJSONSource | undefined;

    zoneSource?.setData(toZoneCollection(zones));
    pointSource?.setData(toPointCollection(points));

    if (autoFitRef.current && !hasFitBoundsRef.current) {
      const bounds = fitBoundsForData(zones, points);

      if (bounds) {
        mapRef.current.fitBounds(bounds, {
          padding: 44,
          maxZoom: maxAutoFitZoomRef.current,
          duration: 0,
        });
        hasFitBoundsRef.current = true;
      }
    }
  }, [mapIsReady, points, zones]);

  if (!mapTilerKey) {
    return <MapConfigurationState />;
  }

  if (mapError) {
    return (
      <MapMessageState
        title="Peta gagal dimuat"
        description="Coba muat ulang halaman. Ringkasan zona dan titik panas tetap tersedia."
      />
    );
  }

  return (
    <div
      aria-label="Peta zona gambut dan hotspot satelit"
      className={className ?? "h-full min-h-72 overflow-hidden rounded-2xl"}
      role="region"
    >
      <div className="h-full min-h-72 w-full" ref={containerRef} />
    </div>
  );
}
