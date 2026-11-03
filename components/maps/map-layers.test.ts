import { expect, test } from "bun:test";
import type { Map as MapLibreMap } from "maplibre-gl";

import { toPointCollection } from "@/components/maps/map-data";
import {
  addMapLayers,
  UNRATED_REPORT_URGENCY_COLOR,
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
  expect(feature.properties.urgency).toBe("");
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
  const urgencyMatch = circleColor[reportConditionIndex + 1] as unknown[];

  expect(reportConditionIndex).toBeGreaterThan(-1);
  expect(urgencyMatch[0]).toBe("match");
  expect(urgencyMatch.at(-1)).toBe(UNRATED_REPORT_URGENCY_COLOR);
  expect(urgencyMatch.at(-1)).not.toBe("#047857");
});
