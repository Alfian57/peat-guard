import { describe, expect, test } from "bun:test";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";

import { addMapInteractions } from "@/components/maps/map-interactions";

type RegisteredHandler = (event: MapMouseEvent) => void;

function createMapMock(renderedFeatures: unknown[] = []) {
  const handlers = new Map<string, RegisteredHandler>();
  const map = {
    on: (
      event: string,
      layerOrHandler: string | RegisteredHandler,
      handler?: RegisteredHandler,
    ) => {
      const layer = typeof layerOrHandler === "string" ? layerOrHandler : "map";
      const callback =
        typeof layerOrHandler === "function" ? layerOrHandler : handler;

      if (callback) {
        handlers.set(`${event}:${layer}`, callback);
      }
    },
    getCanvas: () => ({ style: { cursor: "" } }),
    queryRenderedFeatures: () => renderedFeatures,
  } as unknown as MapLibreMap;

  return { handlers, map };
}

function clickEvent(): MapMouseEvent {
  return {
    lngLat: { lng: 114.2, lat: -1.6 },
    point: { x: 12, y: 15 },
    features: [],
  } as unknown as MapMouseEvent;
}

describe("map draft editing interactions", () => {
  test("routes clicks over rendered layers to the draft callback", () => {
    const { handlers, map } = createMapMock();
    const coordinates: [number, number][] = [];

    addMapInteractions(map, {
      isDraftEditing: () => true,
      onMapClick: (coordinate) => coordinates.push(coordinate),
      onPointSelect: () => {
        throw new Error("Point selection should be suppressed while drawing.");
      },
      onZoneSelect: () => {
        throw new Error("Zone selection should be suppressed while drawing.");
      },
    });

    handlers.get("click:peatguard-points")?.(clickEvent());
    handlers.get("click:peatguard-zone-fill")?.(clickEvent());
    handlers.get("click:map")?.(clickEvent());

    expect(coordinates).toEqual([[114.2, -1.6]]);
  });

  test("keeps map clicks on interactive layers reserved for feature selection by default", () => {
    const { handlers, map } = createMapMock([
      { layer: { id: "peatguard-zone-fill" } },
    ]);
    const coordinates: [number, number][] = [];

    addMapInteractions(map, {
      onMapClick: (coordinate) => coordinates.push(coordinate),
    });

    handlers.get("click:map")?.(clickEvent());

    expect(coordinates).toEqual([]);
  });
});
