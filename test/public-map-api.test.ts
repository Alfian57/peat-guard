import { describe, expect, mock, test } from "bun:test";

import {
  buildPublicHotspotQuery,
  buildPublicZoneQuery,
} from "@/lib/public/data";
import { createPublicMapHandler } from "@/lib/public/http";
import {
  MAX_PUBLIC_RESULT_LIMIT,
  parsePublicMapQuery,
  type PublicMapQuery,
} from "@/lib/public/query";

function parseQuery(search = "") {
  const result = parsePublicMapQuery(new URLSearchParams(search));

  if (!result.success) {
    throw new Error("Test query should be valid.");
  }

  return result.data;
}

describe("public map query validation", () => {
  test("accepts the exact NASA source allowlist and bounded filters", () => {
    expect(
      parsePublicMapQuery(
        new URLSearchParams(
          "bbox=109,-5,117,2&period=24h&source=VIIRS_NOAA20_NRT&confidence=high&limit=25",
        ),
      ),
    ).toEqual({
      success: true,
      data: {
        viewport: { west: 109, south: -5, east: 117, north: 2 },
        period: "24h",
        source: "VIIRS_NOAA20_NRT",
        confidence: "high",
        limit: 25,
      },
    });
  });

  test.each([
    "source=arbitrary-provider",
    "source=VIIRS_SNPP_NRT&source=demo",
    "bbox=109,-5,140,2",
    "bbox=120,2,109,-5",
    "period=yesterday",
    "confidence=urgent",
    "limit=501",
    "limit=0",
    "unexpected=value",
  ])("rejects an invalid query: %s", (search) => {
    expect(parsePublicMapQuery(new URLSearchParams(search))).toEqual({
      success: false,
      code: "invalid_query",
    });
  });

  test("caps source rows independently from the default result limit", () => {
    expect(parseQuery().limit).toBe(MAX_PUBLIC_RESULT_LIMIT);
    expect(parseQuery("limit=1").limit).toBe(1);
  });
});

describe("public map API handler", () => {
  test("rejects invalid query values before loading public data", async () => {
    const loadData = mock(async () => {
      throw new Error("The database must not be queried.");
    });
    const handler = createPublicMapHandler(loadData);

    const response = await handler(
      new Request("http://localhost/api/public/map?source=private-table"),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(loadData).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      error: "Filter peta tidak valid.",
      code: "invalid_query",
    });
  });

  test("returns public data without caching and hides database failures", async () => {
    const loadData = mock(async () => {
      throw new Error("postgres://private-connection-string");
    });
    const handler = createPublicMapHandler(loadData);

    const response = await handler(
      new Request("http://localhost/api/public/map?source=demo"),
    );
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toBe('{"error":"Data peta publik belum dapat dimuat."}');
    expect(body).not.toContain("private-connection-string");
  });

  test("passes validated filters to the read-only data loader", async () => {
    const loadData = mock(async (query: PublicMapQuery) => ({
      generatedAt: "2026-11-15T05:00:00.000Z",
      viewport: query.viewport,
      period: query.period,
      source: query.source,
      confidence: query.confidence,
      zones: [],
      hotspots: [],
      truncated: { zones: false, hotspots: false },
      freshness: {
        provider: "NASA FIRMS" as const,
        status: "unavailable" as const,
        configured: true,
        checkedAt: "2026-11-15T05:00:00.000Z",
        lastSuccessfulAt: null,
        expectedIntervalMinutes: 30,
      },
    }));
    const handler = createPublicMapHandler(loadData);

    const response = await handler(
      new Request(
        "http://localhost/api/public/map?bbox=109,-5,117,2&period=24h&source=demo&confidence=unknown&limit=12",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(loadData).toHaveBeenCalledWith({
      viewport: { west: 109, south: -5, east: 117, north: 2 },
      period: "24h",
      source: "demo",
      confidence: "unknown",
      limit: 12,
    });
    expect(body).toMatchObject({
      period: "24h",
      source: "demo",
      confidence: "unknown",
      hotspots: [],
    });
  });
});

describe("public map PostGIS queries", () => {
  test("uses spatial predicates, selects public fields, and binds bounded limits", () => {
    const query = parseQuery(
      "bbox=109,-5,117,2&source=VIIRS_SNPP_NRT&limit=20",
    );
    const checkedAt = new Date("2026-11-15T05:00:00.000Z");
    const hotspotSql = buildPublicHotspotQuery(query, checkedAt);
    const zoneSql = buildPublicZoneQuery(query);

    expect(hotspotSql.sql).toContain("ST_Intersects");
    expect(hotspotSql.sql).toContain("ST_MakeEnvelope");
    expect(hotspotSql.sql).toContain("satellite_hotspots");
    expect(hotspotSql.sql).not.toContain("external_id");
    expect(hotspotSql.sql).not.toContain("reporter_id");
    expect(hotspotSql.values).toContain("VIIRS_SNPP_NRT");
    expect(hotspotSql.values).toContain(21);
    expect(zoneSql.sql).toContain("forest_zones");
    expect(zoneSql.sql).toContain("zone.is_approved = TRUE");
    expect(zoneSql.sql).toContain("ST_Intersects");
    expect(zoneSql.values).toContain(21);
  });

  test("applies a separate approved-zone cap and marks extra rows with limit+1", () => {
    const query = parseQuery("limit=500");
    const hotspotSql = buildPublicHotspotQuery(
      query,
      new Date("2026-11-15T05:00:00.000Z"),
    );
    const zoneSql = buildPublicZoneQuery(query);

    expect(hotspotSql.values).toContain(501);
    expect(zoneSql.values).toContain(101);
  });

  test("uses categorical VIIRS confidence values without numeric bands", () => {
    const query = parseQuery("period=24h&confidence=low&source=all");
    const hotspotSql = buildPublicHotspotQuery(
      query,
      new Date("2026-11-15T05:00:00.000Z"),
    );

    expect(hotspotSql.sql).toContain("hotspot.acquired_at >=");
    expect(hotspotSql.sql).toContain("LOWER(hotspot.confidence) = 'low'");
    expect(hotspotSql.sql).not.toContain("hotspot.confidence::integer");
    expect(hotspotSql.values.some((value) => value instanceof Date)).toBe(true);
    expect(hotspotSql.values).toContain("VIIRS_SNPP_NRT");
    expect(hotspotSql.values).toContain("DEMO_VIIRS");
  });

  test("filters numeric confidence as its original value without mapping classes", () => {
    const query = parseQuery("confidence=numeric");
    const hotspotSql = buildPublicHotspotQuery(
      query,
      new Date("2026-11-15T05:00:00.000Z"),
    );

    expect(hotspotSql.sql).toContain("hotspot.confidence ~ '^[0-9]{1,3}$'");
    expect(hotspotSql.sql).toContain(
      "hotspot.confidence::integer BETWEEN 0 AND 100",
    );
    expect(hotspotSql.sql).not.toContain("<= 30");
    expect(hotspotSql.sql).not.toContain("BETWEEN 31 AND 80");
  });
});
