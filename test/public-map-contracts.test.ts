import { describe, expect, test } from "bun:test";

import {
  parsePublicMapData,
  parsePublicMetrics,
} from "@/lib/public/client-contracts";

const validMapResponse = {
  generatedAt: "2026-11-15T05:00:00.000Z",
  viewport: { west: 109, south: -5, east: 117, north: 2 },
  period: "7d",
  source: "all",
  confidence: "all",
  zones: [
    {
      name: "Zona demo gambut",
      areaHectares: 150,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [113.9, -2],
            [114, -2],
            [114, -2.1],
            [113.9, -2.1],
            [113.9, -2],
          ],
        ],
      },
      isDemoData: true,
    },
  ],
  hotspots: [
    {
      coordinates: [113.95, -2.05],
      source: "DEMO_VIIRS",
      confidence: "nominal",
      brightnessKelvin: 315.4,
      acquiredAt: "2026-11-15T04:00:00.000Z",
      isDemoData: true,
    },
  ],
  truncated: { zones: false, hotspots: false },
  freshness: {
    provider: "NASA FIRMS",
    status: "not_configured",
    configured: false,
    checkedAt: "2026-11-15T05:00:00.000Z",
    lastSuccessfulAt: null,
    expectedIntervalMinutes: 30,
  },
};

describe("public map runtime contracts", () => {
  test("validates the DTO and labels synthetic hotspots explicitly", () => {
    const data = parsePublicMapData(validMapResponse);

    expect(data.zones[0]?.id).toBe("public-zone-0");
    expect(data.hotspots[0]?.id).toBe("public-hotspot-0");
    expect(data.hotspots[0]?.label).toBe("Titik panas contoh");
    expect(data.hotspots[0]?.description).toContain("Ilustrasi sintetis");
  });

  test("rejects report identity fields and non-allowlisted sources", () => {
    expect(() =>
      parsePublicMapData({ ...validMapResponse, reporterId: "private-id" }),
    ).toThrow();

    const [demoHotspot] = validMapResponse.hotspots;
    expect(() =>
      parsePublicMapData({
        ...validMapResponse,
        hotspots: [{ ...demoHotspot, source: "unapproved-provider" }],
      }),
    ).toThrow();
  });

  test("rejects malformed geometry and incorrect demo provenance", () => {
    const [demoZone] = validMapResponse.zones;
    const [demoHotspot] = validMapResponse.hotspots;

    expect(() =>
      parsePublicMapData({
        ...validMapResponse,
        zones: [
          {
            ...demoZone,
            geometry: { type: "Polygon", coordinates: [] },
          },
        ],
      }),
    ).toThrow();

    expect(() =>
      parsePublicMapData({
        ...validMapResponse,
        hotspots: [{ ...demoHotspot, isDemoData: false }],
      }),
    ).toThrow();
  });

  test("validates public metric values without accepting extra fields", () => {
    expect(
      parsePublicMetrics({
        approvedZoneCount: 2,
        protectedAreaHectares: 300,
        estimatedCarbonTons: 400,
        estimatedIncentiveIdr: 2000,
        hotspotCount: 10,
        containsIllustrativeData: true,
      }).containsIllustrativeData,
    ).toBe(true);

    expect(() =>
      parsePublicMetrics({
        approvedZoneCount: 2,
        protectedAreaHectares: 300,
        estimatedCarbonTons: 400,
        estimatedIncentiveIdr: 2000,
        hotspotCount: 10,
        containsIllustrativeData: true,
        reportCount: 42,
      }),
    ).toThrow();
  });
});
