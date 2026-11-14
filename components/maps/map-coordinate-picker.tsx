"use client";

import { useMemo, useRef, useState } from "react";
import {
  LoaderCircle,
  MapPin,
  MousePointerClick,
  Navigation,
} from "lucide-react";

import { MapCanvasLoader } from "@/components/maps/map-canvas-loader";
import type { MapPoint, MapPointKind, MapZone } from "@/lib/maps/types";

export type MapCoordinatePickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  zones?: MapZone[];
  className?: string;
  compact?: boolean;
  heightClassName?: string;
  pointKind?: MapPointKind;
  title?: string;
  hint?: string;
  showCurrentLocationButton?: boolean;
};

export function MapCoordinatePicker({
  latitude,
  longitude,
  onChange,
  zones,
  className,
  compact = false,
  heightClassName = "h-64 sm:h-80",
  pointKind = "water",
  title = "Pilih titik lokasi pada peta",
  hint = "Klik pada peta untuk menentukan atau memindahkan posisi pin.",
  showCurrentLocationButton = true,
}: MapCoordinatePickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [cameraRequest, setCameraRequest] = useState<{
    id: number;
    center: [longitude: number, latitude: number];
    zoom: number;
  }>();
  const cameraRequestIdRef = useRef(0);

  const hasCoordinates =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  const points = useMemo<MapPoint[]>(() => {
    if (!hasCoordinates || latitude === null || longitude === null) {
      return [];
    }

    return [
      {
        id: "coordinate-picker-active-point",
        coordinates: [longitude, latitude],
        kind: pointKind,
        label: "Titik lokasi terpilih",
        description: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        reportPinState: "safe",
      },
    ];
  }, [hasCoordinates, latitude, longitude, pointKind]);

  const initialCenter = useMemo<[number, number]>(() => {
    if (hasCoordinates && longitude !== null && latitude !== null) {
      return [longitude, latitude];
    }
    return [113.9, -2.01];
  }, [hasCoordinates, latitude, longitude]);

  const initialZoom = hasCoordinates ? 12 : 6.5;

  function handleMapClick(coordinates: [number, number]) {
    const [lng, lat] = coordinates;
    onChange({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    });
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        onChange({ latitude: lat, longitude: lng });
        cameraRequestIdRef.current += 1;
        setCameraRequest({
          id: cameraRequestIdRef.current,
          center: [lng, lat],
          zoom: 12,
        });
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className={className ?? "space-y-2"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-peat-forest">
            {title}
          </span>
          <p className="text-[11px] text-peat-forest/65">{hint}</p>
        </div>
        <div className="flex items-center gap-2 empty:hidden">
          {!compact ? (
            hasCoordinates && latitude !== null && longitude !== null ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-peat-forest/5 px-2.5 py-1 font-mono text-xs font-semibold text-peat-forest">
                <MapPin
                  aria-hidden="true"
                  className="text-peat-green"
                  size={13}
                />
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Belum ada titik dipilih
              </span>
            )
          ) : null}
          {showCurrentLocationButton ? (
            <button
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-peat-forest/15 bg-white px-2.5 py-1 text-xs font-semibold text-peat-forest transition hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-peat-green disabled:opacity-50"
              disabled={isLocating}
              onClick={handleUseCurrentLocation}
              type="button"
            >
              {isLocating ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin text-peat-green"
                  size={13}
                />
              ) : (
                <Navigation
                  aria-hidden="true"
                  className="text-peat-green"
                  size={13}
                />
              )}
              GPS Saya
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-xl border border-peat-forest/15 bg-peat-paper shadow-xs [&>[data-map-placeholder]]:min-h-0 [&>[data-map-placeholder]]:rounded-none ${heightClassName}`}
      >
        <MapCanvasLoader
          autoFit={!hasCoordinates && Boolean(zones && zones.length > 0)}
          cameraRequest={cameraRequest}
          className="h-full w-full overflow-hidden [&>div:first-child]:min-h-0"
          clusterPoints={false}
          draftEditing={true}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          maxAutoFitZoom={7.5}
          onMapClick={handleMapClick}
          points={points}
          zones={zones ?? []}
        />
      </div>

      {!compact ? (
        <p className="flex items-center gap-1.5 text-[11px] text-peat-forest/65">
          <MousePointerClick
            aria-hidden="true"
            className="shrink-0 text-peat-green"
            size={13}
          />
          Klik pada peta untuk memindahkan pin koordinat. Anda juga dapat
          menyunting angka lintang & bujur di bawah.
        </p>
      ) : null}
    </div>
  );
}
