import { afterEach, expect, mock, test } from "bun:test";
import { act, render, screen } from "@testing-library/react";

const originalMapKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
type Listener = (payload?: unknown) => void;
const maps: TestMap[] = [];
let throwOnMapConstruction = false;

class TestMap {
  private listeners = new Map<string, Set<Listener>>();
  sources = new Map<string, { setData: ReturnType<typeof mock> }>();
  emitStyleLoadImmediately = false;
  addControl = mock(() => this);
  addLayer = mock(() => this);
  flyTo = mock(() => this);
  fitBounds = mock(() => this);
  remove = mock(() => undefined);
  fallbackStyle: unknown;
  setStyle = mock((style: unknown) => {
    this.fallbackStyle = style;
    if (this.emitStyleLoadImmediately) this.emit("style.load");
    return this;
  });

  constructor(readonly options?: { style?: string }) {
    if (throwOnMapConstruction) throw new Error("WebGL is unavailable");
    maps.push(this);
  }
  on(
    event: string,
    layerOrListener: string | Listener,
    layerListener?: Listener,
  ) {
    const listener =
      typeof layerOrListener === "string" ? layerListener : layerOrListener;
    if (listener) {
      const handlers = this.listeners.get(event) ?? new Set<Listener>();
      handlers.add(listener);
      this.listeners.set(event, handlers);
    }
    return this;
  }
  once(event: string, listener: Listener) {
    const onceListener: Listener = (payload) => {
      this.listeners.get(event)?.delete(onceListener);
      listener(payload);
    };
    return this.on(event, onceListener);
  }
  emit(event: string, payload?: unknown) {
    [...(this.listeners.get(event) ?? [])].forEach((listener) =>
      listener(payload),
    );
  }
  addSource(id: string) {
    this.sources.set(id, { setData: mock(() => undefined) });
  }
  getSource(id: string) {
    return this.sources.get(id);
  }
  getBounds() {
    return {
      getWest: () => 113,
      getSouth: () => -3,
      getEast: () => 115,
      getNorth: () => -1,
    };
  }
}

mock.module("maplibre-gl", () => ({
  Map: TestMap,
  NavigationControl: class {},
  Popup: class {},
  setWorkerUrl: () => undefined,
}));

const { default: MapCanvas } = await import("@/components/maps/map-canvas");

afterEach(() => {
  process.env.NEXT_PUBLIC_MAPTILER_KEY = originalMapKey;
  throwOnMapConstruction = false;
  maps.length = 0;
});

function mapTilerError() {
  return {
    error: Object.assign(new Error("Key usage restricted"), {
      status: 403,
      url: "https://api.maptiler.com/maps/streets-v4/style.json?key=test-key",
    }),
  };
}

test("initializes operational layers when a denied MapTiler style falls back immediately", () => {
  process.env.NEXT_PUBLIC_MAPTILER_KEY = "test-key";
  const onViewportChange = mock(() => undefined);
  render(
    <MapCanvas onViewportChange={onViewportChange} points={[]} zones={[]} />,
  );
  const map = maps[0];
  map.emitStyleLoadImmediately = true;

  act(() => map.emit("error", mapTilerError()));
  expect(map.setStyle).toHaveBeenCalledTimes(1);
  expect(map.sources.has("peatguard-approved-zones")).toBe(true);
  expect(map.sources.has("peatguard-public-points")).toBe(true);
  expect(onViewportChange).toHaveBeenCalledTimes(1);
  expect(map.options?.style).toBe(
    "https://api.maptiler.com/maps/streets-v4/style.json?key=test-key",
  );
  expect(
    (
      map.fallbackStyle as {
        sources: { "osm-tiles": { tiles: string[] } };
      }
    ).sources["osm-tiles"].tiles,
  ).toEqual(["https://tile.openstreetmap.org/{z}/{x}/{y}.png"]);
  expect(screen.queryByText("Peta gagal dimuat")).toBeNull();
});

test("ignores remaining denied MapTiler requests while the fallback style loads", () => {
  process.env.NEXT_PUBLIC_MAPTILER_KEY = "test-key";
  render(<MapCanvas points={[]} zones={[]} />);
  const map = maps[0];

  act(() => {
    map.emit("error", mapTilerError());
    map.emit("error", mapTilerError());
  });
  expect(map.setStyle).toHaveBeenCalledTimes(1);
  expect(map.remove).not.toHaveBeenCalled();
  expect(screen.queryByText("Peta gagal dimuat")).toBeNull();
  act(() => map.emit("style.load"));
  expect(map.sources.has("peatguard-approved-zones")).toBe(true);
});

test("keeps operational layers visible and reports when fallback tiles fail", () => {
  process.env.NEXT_PUBLIC_MAPTILER_KEY = "test-key";
  render(<MapCanvas points={[]} zones={[]} />);
  const map = maps[0];
  act(() => map.emit("error", mapTilerError()));
  act(() => map.emit("style.load"));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    act(() =>
      map.emit("error", {
        error: Object.assign(new Error("Basemap unavailable"), {
          url: "https://tile.openstreetmap.org/6/52/32.png",
        }),
      }),
    );
  }
  expect(map.setStyle).toHaveBeenCalledTimes(1);
  expect(map.remove).not.toHaveBeenCalled();
  expect(map.sources.has("peatguard-approved-zones")).toBe(true);
  expect(screen.getByText(/Layer zona dan titik tetap tersedia/)).toBeTruthy();
});

test("does not replace the basemap for one isolated tile failure", () => {
  process.env.NEXT_PUBLIC_MAPTILER_KEY = "test-key";
  render(<MapCanvas points={[]} zones={[]} />);
  const map = maps[0];

  act(() =>
    map.emit("error", {
      error: Object.assign(new Error("One tile failed"), {
        status: 500,
        url: "https://api.maptiler.com/maps/streets-v4/tiles/6/52/32.pbf",
      }),
    }),
  );

  expect(map.setStyle).not.toHaveBeenCalled();
});

test("re-centers after a delayed GPS camera request", () => {
  process.env.NEXT_PUBLIC_MAPTILER_KEY = "test-key";
  const { rerender } = render(<MapCanvas points={[]} zones={[]} />);
  const map = maps[0];
  act(() => map.emit("load"));

  rerender(
    <MapCanvas
      cameraRequest={{ id: 1, center: [110.403431, -7.791966], zoom: 12 }}
      points={[]}
      zones={[]}
    />,
  );

  expect(map.flyTo).toHaveBeenCalledWith({
    center: [110.403431, -7.791966],
    zoom: 12,
    essential: true,
  });
});

test("shows a contained map error when WebGL map construction throws", async () => {
  process.env.NEXT_PUBLIC_MAPTILER_KEY = "test-key";
  throwOnMapConstruction = true;

  render(<MapCanvas points={[]} zones={[]} />);

  expect(await screen.findByText("Peta gagal dimuat")).toBeTruthy();
});
