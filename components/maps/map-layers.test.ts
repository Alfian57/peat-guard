import { expect, test } from "bun:test";
import type { Map as MapLibreMap } from "maplibre-gl";

import { toPointCollection } from "@/components/maps/map-data";
import { getReportPinState } from "@/components/command/map/report-map-point";
import {
  addMapLayers,
  NEUTRAL_REPORT_PIN_COLOR,
} from "@/components/maps/map-layers";
import { toCommandReportMapPoint } from "@/components/command/map/report-map-point";

test("keeps unrated reports neutral in point data and the MapLibre style", () => {
  const reportPoint = toCommandReportMapPoint({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    latitude: -1.25,
    longitude: 114.75,
    capturedAt: "2026-11-15T02:00:00.000Z",
    aiUrgency: null,
    aiCategory: null,
    handlingStatus: "MENUNGGU_TINDAKAN",
    isDemoSample: false,
  });
  const feature = toPointCollection([reportPoint]).features[0];

  expect(reportPoint.urgency).toBeUndefined();
  expect(reportPoint.reportPinState).toBe("neutral");
  expect(feature.properties.urgency).toBe("");
  expect(feature.properties.reportPinState).toBe("neutral");
  expect(reportPoint.description).toContain("Kategori belum dinilai");

  const layers: Array<{ id?: string; paint?: Record<string, unknown> }> = [];
  const map = {
    addSource: () => undefined,
    addLayer: (layer: { id?: string; paint?: Record<string, unknown> }) =>
      layers.push(layer),
  } as unknown as MapLibreMap;

  addMapLayers(map, [], [reportPoint]);

  const pointLayer = layers.find((layer) => layer.id === "peatguard-points");
  const circleColor = pointLayer?.paint?.["circle-color"] as unknown[];
  const reportConditionIndex = circleColor.findIndex(
    (entry) =>
      Array.isArray(entry) &&
      entry[0] === "==" &&
      JSON.stringify(entry) ===
        JSON.stringify(["==", ["get", "kind"], "report"]),
  );
  const pinStateMatch = circleColor[reportConditionIndex + 1] as unknown[];

  expect(reportConditionIndex).toBeGreaterThan(-1);
  expect(pinStateMatch[0]).toBe("match");
  expect(pinStateMatch[1]).toEqual(["get", "reportPinState"]);
  expect(pinStateMatch.at(-1)).toBe(NEUTRAL_REPORT_PIN_COLOR);
  expect(pinStateMatch.at(-1)).not.toBe("#047857");
});

test("uses safe category or completed handling as the green pin state", () => {
  const point = {
    aiUrgency: "RENDAH" as const,
    aiCategory: "API_AKTIF" as const,
    handlingStatus: "MENUNGGU_TINDAKAN" as const,
  };

  expect(getReportPinState(point)).toBe("neutral");
  expect(getReportPinState({ ...point, aiCategory: "AMAN_TERKENDALI" })).toBe(
    "safe",
  );
  expect(getReportPinState({ ...point, handlingStatus: "SELESAI" })).toBe(
    "safe",
  );
});

test("keeps critical and warning pins distinct from low urgency", () => {
  const point = {
    aiCategory: "API_AKTIF" as const,
    handlingStatus: "MENUNGGU_TINDAKAN" as const,
  };

  expect(getReportPinState({ ...point, aiUrgency: "KRITIS" })).toBe("critical");
  expect(getReportPinState({ ...point, aiUrgency: "WASPADA" })).toBe("warning");
  expect(getReportPinState({ ...point, aiUrgency: "RENDAH" })).toBe("neutral");
});

test("can disable point clustering for transparent public hotspot markers", () => {
  const reportPoint = toCommandReportMapPoint({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    latitude: -1.25,
    longitude: 114.75,
    capturedAt: "2026-11-15T02:00:00.000Z",
    aiUrgency: null,
    aiCategory: null,
    handlingStatus: "MENUNGGU_TINDAKAN",
    isDemoSample: false,
  });
  const sources: Array<{ cluster?: boolean }> = [];
  const layers: Array<{ id?: string }> = [];
  const map = {
    addSource: (_id: string, source: { cluster?: boolean }) =>
      sources.push(source),
    addLayer: (layer: { id?: string }) => layers.push(layer),
  } as unknown as MapLibreMap;

  addMapLayers(map, [], [reportPoint], false);

  expect(sources[1]?.cluster).toBe(false);
  expect(layers.some((layer) => layer.id === "peatguard-clusters")).toBe(false);
  expect(layers.some((layer) => layer.id === "peatguard-points")).toBe(true);
});
