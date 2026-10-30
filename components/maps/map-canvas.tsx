"use client";

import {
  Map as MapLibreMap,
  NavigationControl,
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
import type { MapPoint, MapZone } from "@/lib/maps/types";

const DEFAULT_CENTER: [number, number] = [113.9, -2.01];

type MapData = {
  zones: MapZone[];
  points: MapPoint[];
};

export type MapCanvasProps = {
  zones: MapZone[];
  points: MapPoint[];
  className?: string;
  interactive?: boolean;
  onMapClick?: (coordinates: [longitude: number, latitude: number]) => void;
  onPointSelect?: (point: MapPoint) => void;
  onZoneSelect?: (zone: MapZone) => void;
};

export default function MapCanvas({
  zones,
  points,
  className,
  interactive = true,
  onMapClick,
  onPointSelect,
  onZoneSelect,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onPointSelectRef = useRef(onPointSelect);
  const onZoneSelectRef = useRef(onZoneSelect);
  const latestDataRef = useRef<MapData>({ zones, points });
  const loadedRef = useRef(false);
  const hasFitBoundsRef = useRef(false);
  const [mapIsReady, setMapIsReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onPointSelectRef.current = onPointSelect;
    onZoneSelectRef.current = onZoneSelect;
  }, [onMapClick, onPointSelect, onZoneSelect]);

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
      center: DEFAULT_CENTER,
      zoom: 8,
      cooperativeGestures: true,
      interactive,
      maxZoom: 17,
      minZoom: 4,
    });

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.once("load", () => {
      if (disposed) {
        return;
      }

      setMapError(false);
      const currentData = latestDataRef.current;
      addMapLayers(map, currentData.zones, currentData.points);

      const bounds = fitBoundsForData(currentData.zones, currentData.points);

      if (bounds) {
        map.fitBounds(bounds, { padding: 44, maxZoom: 12, duration: 0 });
        hasFitBoundsRef.current = true;
      }

      addMapInteractions(map, {
        onMapClick: (coordinates) => onMapClickRef.current?.(coordinates),
        onPointSelect: (point) => onPointSelectRef.current?.(point),
        onZoneSelect: (zone) => onZoneSelectRef.current?.(zone),
      });

      loadedRef.current = true;
      setMapIsReady(true);
    });

    map.on("error", () => {
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
  }, [interactive, mapTilerKey]);

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

    if (!hasFitBoundsRef.current) {
      const bounds = fitBoundsForData(zones, points);

      if (bounds) {
        mapRef.current.fitBounds(bounds, {
          padding: 44,
          maxZoom: 12,
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
