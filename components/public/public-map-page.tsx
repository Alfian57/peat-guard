"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  PublicMapScreen,
  type PublicMapLoadState,
} from "@/components/public/public-map-screen";
import type { PublicMapFilters } from "@/components/public/public-map-filters";
import type { MapViewport } from "@/lib/maps/types";
import {
  parsePublicMapData,
  type PublicMapViewData,
} from "@/lib/public/client-contracts";
import { PUBLIC_DEFAULT_VIEWPORT } from "@/lib/public/query";

const INITIAL_FILTERS: PublicMapFilters = {
  period: "7d",
  source: "all",
  confidence: "all",
};

export function PublicMapPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedViewport, setAppliedViewport] = useState<MapViewport>(
    PUBLIC_DEFAULT_VIEWPORT,
  );
  const [draftViewport, setDraftViewport] = useState<MapViewport>(
    PUBLIC_DEFAULT_VIEWPORT,
  );
  const [hasUnappliedViewport, setHasUnappliedViewport] = useState(false);
  const [data, setData] = useState<PublicMapViewData | null>(null);
  const [loadState, setLoadState] = useState<PublicMapLoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const viewportInitializedRef = useRef(false);
  const appliedViewportRef = useRef(PUBLIC_DEFAULT_VIEWPORT);

  useEffect(() => {
    const controller = new AbortController();
    const searchParams = new URLSearchParams({
      bbox: formatViewport(appliedViewport),
      period: filters.period,
      source: filters.source,
      confidence: filters.confidence,
    });

    fetch(`/api/public/map?${searchParams}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new PublicMapRequestError(response.status);
        }

        return response.json() as Promise<unknown>;
      })
      .then(parsePublicMapData)
      .then((mapData) => {
        if (
          mapData.period !== filters.period ||
          mapData.source !== filters.source ||
          mapData.confidence !== filters.confidence ||
          formatViewport(mapData.viewport) !== formatViewport(appliedViewport)
        ) {
          throw new Error(
            "The map response does not match the active filters.",
          );
        }

        setData(mapData);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof PublicMapRequestError && error.status === 400
            ? "Area pencarian terlalu luas atau tidak valid. Perbesar peta, lalu coba area yang lebih kecil."
            : "Data peta belum dapat dimuat. Periksa koneksi, lalu coba lagi.",
        );
        setLoadState("error");
      });

    return () => controller.abort();
  }, [appliedViewport, filters, retryKey]);

  const handleViewportChange = useCallback((viewport: MapViewport) => {
    setDraftViewport(viewport);

    if (!viewportInitializedRef.current) {
      viewportInitializedRef.current = true;

      if (isSearchableViewport(viewport)) {
        const initialViewport = roundViewport(viewport);
        setDraftViewport(initialViewport);

        if (
          formatViewport(initialViewport) !==
          formatViewport(appliedViewportRef.current)
        ) {
          appliedViewportRef.current = initialViewport;
          setLoadState("loading");
          setErrorMessage(null);
          setData(null);
          setAppliedViewport(initialViewport);
        }

        return;
      }
    }

    setHasUnappliedViewport(
      formatViewport(viewport) !== formatViewport(appliedViewportRef.current),
    );
  }, []);

  function updateFilters(nextFilters: Partial<PublicMapFilters>) {
    setLoadState("loading");
    setErrorMessage(null);
    setData(null);
    setFilters((current) => ({ ...current, ...nextFilters }));
  }

  function applyViewport() {
    if (!isSearchableViewport(draftViewport)) {
      setErrorMessage(
        "Area peta melebihi batas pencarian. Perbesar peta agar area kurang dari 20° × 15°.",
      );
      setLoadState("error");
      return;
    }

    const nextViewport = roundViewport(draftViewport);
    appliedViewportRef.current = nextViewport;
    setLoadState("loading");
    setErrorMessage(null);
    setData(null);
    setAppliedViewport(nextViewport);
    setDraftViewport(nextViewport);
    setHasUnappliedViewport(false);
  }

  function retryLoading() {
    setLoadState("loading");
    setErrorMessage(null);
    setData(null);
    setRetryKey((current) => current + 1);
  }

  return (
    <PublicMapScreen
      data={data}
      errorMessage={errorMessage}
      filters={filters}
      hasUnappliedViewport={hasUnappliedViewport}
      loadState={loadState}
      onFilterChange={updateFilters}
      onRetry={retryLoading}
      onSearchViewport={applyViewport}
      onViewportChange={handleViewportChange}
    />
  );
}

class PublicMapRequestError extends Error {
  constructor(readonly status: number) {
    super("Public map request failed.");
  }
}

function formatViewport(viewport: MapViewport): string {
  return [viewport.west, viewport.south, viewport.east, viewport.north]
    .map((coordinate) => coordinate.toFixed(4))
    .join(",");
}

function roundViewport(viewport: MapViewport): MapViewport {
  return {
    west: Number(viewport.west.toFixed(4)),
    south: Number(viewport.south.toFixed(4)),
    east: Number(viewport.east.toFixed(4)),
    north: Number(viewport.north.toFixed(4)),
  };
}

function isSearchableViewport(viewport: MapViewport): boolean {
  return (
    [viewport.west, viewport.south, viewport.east, viewport.north].every(
      Number.isFinite,
    ) &&
    viewport.west >= -180 &&
    viewport.east <= 180 &&
    viewport.south >= -90 &&
    viewport.north <= 90 &&
    viewport.west < viewport.east &&
    viewport.south < viewport.north &&
    viewport.east - viewport.west <= 20 &&
    viewport.north - viewport.south <= 15
  );
}
