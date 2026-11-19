import { describe, expect, mock, test } from "bun:test";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";

import { addMapInteractions } from "@/components/maps/map-interactions";

type RegisteredHandler = (event: MapMouseEvent) => void | Promise<void>;

function createMapMock(existingLayers?: string[]) {
  const handlers = new Map<string, RegisteredHandler>();
  const requestedLayers: string[][] = [];
  let renderedFeatures: unknown[] = [];
  const getClusterExpansionZoom = mock(async () => 10);
  const pointSource = { getClusterExpansionZoom };
  const easeTo = mock(() => undefined);
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
    getLayer: (id: string) =>
      existingLayers && !existingLayers.includes(id) ? undefined : { id },
    getSource: () => pointSource,
    easeTo,
    queryRenderedFeatures: (
      _point: unknown,
      options?: { layers?: string[] },
    ) => {
      requestedLayers.push(options?.layers ?? []);
      return renderedFeatures;
    },
  } as unknown as MapLibreMap;

  return {
    handlers,
    map,
    requestedLayers,
    getClusterExpansionZoom,
    easeTo,
    setRenderedFeatures: (features: unknown[]) => {
      renderedFeatures = features;
    },
  };
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
    const { handlers, map, requestedLayers } = createMapMock();
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

    handlers.get("click:map")?.(clickEvent());

    expect(coordinates).toEqual([[114.2, -1.6]]);
    expect(requestedLayers).toEqual([]);
  });

  test("routes clicks to the map when feature layers are unavailable", () => {
    const { handlers, map, requestedLayers } = createMapMock([]);
    const coordinates: [number, number][] = [];

    addMapInteractions(map, {
      onMapClick: (coordinate) => coordinates.push(coordinate),
    });

    handlers.get("click:map")?.(clickEvent());

    expect(coordinates).toEqual([[114.2, -1.6]]);
    expect(requestedLayers).toEqual([]);
  });

  test("supports unclustered markers without registering a missing cluster layer", () => {
    const { handlers, map, requestedLayers } = createMapMock();

    addMapInteractions(map, {}, false);
    handlers.get("click:map")?.(clickEvent());

    expect(handlers.has("click:peatguard-clusters")).toBe(false);
    expect(requestedLayers).toEqual([
      ["peatguard-points", "peatguard-zone-fill"],
    ]);
  });

  test("expands a cluster above a zone and ignores a superseded zoom request", async () => {
    const {
      handlers,
      map,
      setRenderedFeatures,
      easeTo,
      getClusterExpansionZoom,
    } = createMapMock();
    const onZoneSelect = mock(() => undefined);
    addMapInteractions(map, { onZoneSelect });
    const handleClick = handlers.get("click:map")!;
    setRenderedFeatures([
      {
        layer: { id: "peatguard-clusters" },
        properties: { cluster_id: 12 },
        geometry: { type: "Point", coordinates: [114.2, -1.6] },
      },
      { layer: { id: "peatguard-zone-fill" } },
    ]);

    await handleClick(clickEvent());
    expect(getClusterExpansionZoom).toHaveBeenCalledWith(12);
    expect(easeTo).toHaveBeenCalledWith({ center: [114.2, -1.6], zoom: 10 });
    expect(onZoneSelect).not.toHaveBeenCalled();

    const pendingZoom = Promise.withResolvers<number>();
    getClusterExpansionZoom.mockImplementationOnce(() => pendingZoom.promise);
    const firstClick = handleClick(clickEvent());
    setRenderedFeatures([]);
    await handleClick(clickEvent());
    pendingZoom.resolve(11);
    await firstClick;
    expect(easeTo).toHaveBeenCalledTimes(1);
  });
});
