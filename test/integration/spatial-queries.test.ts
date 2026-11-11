import { describe, expect, it } from "bun:test";
import { prisma } from "@/lib/prisma";

describe("PostGIS Spatial Integration", () => {
  it("generates and verifies 4326 point geometry", async () => {
    const rows = await prisma.$queryRaw<
      Array<{ srid: number; as_text: string }>
    >`
      SELECT 
        ST_SRID(ST_SetSRID(ST_MakePoint(113.9102, -2.3194), 4326)) AS srid,
        ST_AsText(ST_SetSRID(ST_MakePoint(113.9102, -2.3194), 4326)) AS as_text
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0].srid).toBe(4326);
    expect(rows[0].as_text).toBe("POINT(113.9102 -2.3194)");
  });

  it("calculates proximity between water points and incident coordinates with ST_DWithin", async () => {
    // Distance between (113.9, -2.0) and (113.901, -2.001) is ~190 meters
    const rows = await prisma.$queryRaw<
      Array<{ is_nearby: boolean; distance_meters: number }>
    >`
      SELECT 
        ST_DWithin(
          ST_SetSRID(ST_MakePoint(113.9000, -2.0000), 4326)::geography,
          ST_SetSRID(ST_MakePoint(113.9010, -2.0010), 4326)::geography,
          5000
        ) AS is_nearby,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(113.9000, -2.0000), 4326)::geography,
          ST_SetSRID(ST_MakePoint(113.9010, -2.0010), 4326)::geography
        ) AS distance_meters
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0].is_nearby).toBe(true);
    expect(rows[0].distance_meters).toBeLessThan(500);
    expect(rows[0].distance_meters).toBeGreaterThan(100);
  });

  it("evaluates polygon containment for conservation zone boundary", async () => {
    const rows = await prisma.$queryRaw<
      Array<{ inside: boolean; outside: boolean }>
    >`
      WITH sample_zone AS (
        SELECT ST_SetSRID(
          ST_MakePolygon(
            ST_GeomFromText('LINESTRING(113.8 -2.1, 114.0 -2.1, 114.0 -1.9, 113.8 -1.9, 113.8 -2.1)')
          ), 
          4326
        ) AS geom
      )
      SELECT 
        ST_Contains(geom, ST_SetSRID(ST_MakePoint(113.9, -2.0), 4326)) AS inside,
        ST_Contains(geom, ST_SetSRID(ST_MakePoint(115.0, -3.0), 4326)) AS outside
      FROM sample_zone
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0].inside).toBe(true);
    expect(rows[0].outside).toBe(false);
  });

  it("queries existing seeded water points with PostGIS coordinates", async () => {
    const waterPoints = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        longitude: number;
        latitude: number;
      }>
    >`
      SELECT 
        id, 
        name,
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude
      FROM water_points
      LIMIT 5
    `;
    expect(waterPoints.length).toBeGreaterThan(0);
    expect(waterPoints[0].longitude).toBeDefined();
    expect(waterPoints[0].latitude).toBeDefined();
  });
});
