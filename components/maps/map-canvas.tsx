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
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
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
  cooperativeGestures?: boolean;
  clusterPoints?: boolean;
  autoFit?: boolean;
  maxAutoFitZoom?: number;
  initialCenter?: [longitude: number, latitude: number];
  initialZoom?: number;
  cameraRequest?: {
    id: number;
    center: [longitude: number, latitude: number];
    zoom: number;
  };
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
  cooperativeGestures = true,
  clusterPoints = true,
  autoFit = true,
  maxAutoFitZoom = DEFAULT_MAX_AUTOFIT_ZOOM,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  cameraRequest,
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
  const handledCameraRequestRef = useRef<number | null>(null);
  const [mapIsReady, setMapIsReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [usingFallbackBasemap, setUsingFallbackBasemap] = useState(false);
  const [basemapUnavailable, setBasemapUnavailable] = useState(false);
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
    setMapError(false);
    setUsingFallbackBasemap(false);
    setBasemapUnavailable(false);
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container,
        style:
          "https://api.maptiler.com/maps/streets-v4/style.json?key=" +
          encodeURIComponent(mapTilerKey),
        center: initialCenterRef.current,
        zoom: initialZoomRef.current,
        cooperativeGestures,
        interactive,
        maxZoom: 17,
        minZoom: 4,
        attributionControl: { compact: false },
      });
    } catch {
      const errorTimer = window.setTimeout(() => {
        if (!disposed) setMapError(true);
      }, 0);
      return () => {
        disposed = true;
        window.clearTimeout(errorTimer);
      };
    }

    mapRef.current = map;
    let fallbackActive = false;
    let layersReadyForStyle = false;
    let interactionsAdded = false;
    let primaryTileFailures = 0;
    let fallbackTileFailures = 0;
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

    const initializeMapLayers = () => {
      if (disposed || layersReadyForStyle) {
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

      if (!interactionsAdded) {
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
        interactionsAdded = true;
      }

      layersReadyForStyle = true;
      loadedRef.current = true;
      setMapIsReady(true);
    };

    const switchToFallbackBasemap = () => {
      if (fallbackActive) return;
      fallbackActive = true;
      loadedRef.current = false;
      layersReadyForStyle = false;
      setMapIsReady(false);
      setUsingFallbackBasemap(true);
      map.once("style.load", initializeMapLayers);
      map.setStyle(FALLBACK_BASEMAP_STYLE, { diff: false });
    };

    map.once("load", initializeMapLayers);

    map.on("error", ({ error }) => {
      if (disposed) {
        return;
      }

      const errorUrl =
        "url" in error && typeof error.url === "string" ? error.url : "";
      const errorStatus =
        "status" in error && typeof error.status === "number"
          ? error.status
          : null;
      const isMapTilerError = errorUrl.startsWith("https://api.maptiler.com/");
      const isOsmTileError = errorUrl.startsWith(
        "https://tile.openstreetmap.org/",
      );
      const isWebGlError = /webgl|context lost/i.test(error.message);

      if (isWebGlError) {
        setMapError(true);
        map.remove();
        mapRef.current = null;
        return;
      }

      if (isMapTilerError) {
        // One missing tile should not replace the whole basemap. Authentication,
        // style failures, or repeated tile failures indicate a provider outage.
        primaryTileFailures += 1;
        if (
          !fallbackActive &&
          (errorStatus === 401 ||
            errorStatus === 403 ||
            errorUrl.includes("/style.json") ||
            primaryTileFailures >= 3)
        ) {
          switchToFallbackBasemap();
        }
        return;
      }

      if (!loadedRef.current && !fallbackActive && !errorUrl) {
        switchToFallbackBasemap();
        return;
      }

      if (fallbackActive && isOsmTileError) {
        fallbackTileFailures += 1;
        if (fallbackTileFailures >= 3) setBasemapUnavailable(true);
        return;
      }

      if (!loadedRef.current && !fallbackActive) {
        setMapError(true);
        map.remove();
        mapRef.current = null;
      }
    });

    return () => {
      disposed = true;
      loadedRef.current = false;
      hasFitBoundsRef.current = false;
      if (mapRef.current === map) {
        map.remove();
        mapRef.current = null;
      }
      setMapIsReady(false);
    };
  }, [clusterPoints, cooperativeGestures, interactive, mapTilerKey]);

  useEffect(() => {
    if (
      !cameraRequest ||
      handledCameraRequestRef.current === cameraRequest.id ||
      !mapIsReady ||
      !mapRef.current
    ) {
      return;
    }

    handledCameraRequestRef.current = cameraRequest.id;
    mapRef.current.flyTo({
      center: cameraRequest.center,
      zoom: cameraRequest.zoom,
      essential: true,
    });
  }, [cameraRequest, mapIsReady]);

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
      className={`${className ?? "h-full min-h-72 overflow-hidden rounded-2xl"} relative`}
      role="region"
    >
      <div className="h-full w-full" ref={containerRef} />
      {usingFallbackBasemap || basemapUnavailable ? (
        <p
          aria-live="polite"
          className="absolute bottom-3 left-3 max-w-[calc(100%-5rem)] rounded-lg border border-peat-forest/15 bg-white/95 px-3 py-2 text-xs leading-5 text-peat-forest shadow-sm sm:max-w-sm"
          role="status"
        >
          {basemapUnavailable
            ? "Tile peta dasar tidak dapat dijangkau. Layer zona dan titik tetap tersedia."
            : "Menggunakan peta dasar OpenStreetMap. Zona dan titik tetap interaktif."}
        </p>
      ) : null}
    </div>
  );
}
