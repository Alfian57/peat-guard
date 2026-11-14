import { expect, test } from "bun:test";

import { fitBoundsForData } from "@/components/maps/map-data";
import type { MapZone } from "@/lib/maps/types";

test("fits bounds for large zone geometry without spreading all coordinates", () => {
  const ring = Array.from({ length: 270_010 }, (_, index) => [
    110 + index / 100_000,
    -4 + index / 200_000,
  ]);
  const zone: MapZone = {
    id: "large-zone",
    name: "Large zone",
    areaHectares: 1,
    isDemoData: false,
    geometry: { type: "Polygon", coordinates: [ring] },
  };

  const bounds = fitBoundsForData([zone], []) as [
    [number, number],
    [number, number],
  ];

  expect(bounds[0]).toEqual([110, -4]);
  expect(bounds[1][0]).toBeCloseTo(112.70009, 8);
  expect(bounds[1][1]).toBeCloseTo(-2.649955, 8);
});

test("returns null when no map coordinates are present", () => {
  expect(fitBoundsForData([], [])).toBeNull();
});
