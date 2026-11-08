"use client";

import dynamic from "next/dynamic";

import type { MapCanvasProps } from "@/components/maps/map-canvas";
import { MapConfigurationState } from "@/components/maps/map-message-state";
import { MapLoadingState } from "@/components/maps/map-loading-state";

export { MapLoadingState } from "@/components/maps/map-loading-state";

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
