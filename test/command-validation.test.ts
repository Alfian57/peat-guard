import { describe, expect, test } from "bun:test";

import {
  parseCreateZoneInput,
  parseUpdateZoneInput,
  zoneSlug,
} from "@/lib/server/zones/validation";
import {
  parseCreateWaterPointInput,
  parseUpdateWaterPointInput,
} from "@/lib/server/water/validation";

const validPolygon = {
  type: "Polygon",
  coordinates: [
    [
      [113.9, -2],
      [113.91, -2],
      [113.91, -2.01],
      [113.9, -2.01],
      [113.9, -2],
    ],
  ],
};

describe("command input validation", () => {
  test("zone polygons stay unapproved because approval is not an accepted field", () => {
    expect(() =>
      parseCreateZoneInput({
        zoneName: "Zona Utara",
        geometry: validPolygon,
        isApproved: true,
      }),
    ).toThrow();

    expect(
      parseCreateZoneInput({ zoneName: "Zona Utara", geometry: validPolygon }),
    ).toMatchObject({
      zoneName: "Zona Utara",
      peatDepthMeters: 1.5,
      geometry: validPolygon,
    });
  });

  test("zone edits reject an open or out-of-range polygon", () => {
    expect(() =>
      parseUpdateZoneInput({
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [113, -2],
              [114, -2],
              [114, -3],
              [113, -3],
            ],
          ],
        },
      }),
    ).toThrow();
    expect(() =>
      parseUpdateZoneInput({
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [181, -2],
              [114, -2],
              [114, -3],
              [181, -2],
            ],
          ],
        },
      }),
    ).toThrow();
    expect(() =>
      parseUpdateZoneInput({
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [113, -2, 10],
              [114, -2, 10],
              [114, -3, 10],
              [113, -3, 10],
              [113, -2, 10],
            ],
          ],
        },
      }),
    ).toThrow();
  });

  test("creates a stable slug from the zone name", () => {
    expect(zoneSlug("KHG Sebangau Utara")).toBe("khg-sebangau-utara");
  });

  test("validates water-point coordinates and enum values", () => {
    expect(
      parseCreateWaterPointInput({
        name: "Sekat Kanal 01",
        type: "SEKAT_KANAL",
        latitude: -2.1,
        longitude: 113.9,
      }),
    ).toMatchObject({ zoneId: null, latitude: -2.1, longitude: 113.9 });

    expect(() =>
      parseCreateWaterPointInput({
        name: "Titik",
        type: "UNKNOWN",
        latitude: -2.1,
        longitude: 113.9,
      }),
    ).toThrow();
    expect(() => parseUpdateWaterPointInput({ latitude: 91 })).toThrow();
  });
});
