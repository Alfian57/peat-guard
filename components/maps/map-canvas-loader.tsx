"use client";

import dynamic from "next/dynamic";

import type { MapCanvasProps } from "@/components/maps/map-canvas";
import { MapConfigurationState } from "@/components/maps/map-message-state";

const InteractiveMap = dynamic<MapCanvasProps>(
  () => import("@/components/maps/map-canvas"),
  {
    ssr: false,
    loading: () => <MapLoadingState />,
  },
);

export function MapCanvasLoader(props: MapCanvasProps) {
  const hasMapTilerKey = Boolean(process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim());

  if (!hasMapTilerKey) {
    return <MapConfigurationState />;
  }

  return <InteractiveMap {...props} />;
}

export function MapLoadingState() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat peta"
      className="grid h-full min-h-72 place-items-center rounded-2xl bg-peat-forest/10 px-6 text-center text-sm text-peat-forest"
      role="status"
    >
      <span className="animate-pulse">Memuat peta pantauan…</span>
    </div>
  );
}
