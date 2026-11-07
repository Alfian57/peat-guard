import { afterEach, expect, mock, test } from "bun:test";

const selectedZoneId = "61000000-0000-4000-8000-000000000001";
const queries: Array<{ sql: string; values: unknown[] }> = [];
let snapshotRows: unknown[] = [];
let selectedZone: { id: string } | null = { id: selectedZoneId };

const queryRaw = mock(
  async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = strings.join("?");
    queries.push({ sql, values });

    if (sql.includes("forest_zone_carbon_snapshots")) return snapshotRows;
    if (sql.includes("FROM field_reports")) return [emptyReportAggregate];
    if (sql.includes("FROM satellite_hotspots")) return [emptyHotspotAggregate];

    throw new Error("Unexpected MRV report query.");
  },
);

const findUnique = mock(async () => selectedZone);

mock.module("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: queryRaw,
    forestZone: { findUnique },
  },
}));

const { getMrvReportSource } = await import("@/lib/server/mrv/report-data");

const emptyReportAggregate = {
  activeCount: 0,
  aiTriagedCount: 0,
  closedCount: 0,
  demoActiveCount: 0,
  demoAiTriagedCount: 0,
  demoClosedCount: 0,
  demoCount: 0,
  demoRespondedCount: 0,
  demoResponseMinutes: null,
  nonDemoActiveCount: 0,
  nonDemoAiTriagedCount: 0,
  nonDemoClosedCount: 0,
  nonDemoCount: 0,
  nonDemoRespondedCount: 0,
  nonDemoResponseMinutes: null,
  respondedCount: 0,
  responseMinutes: null,
  totalCount: 0,
};

const emptyHotspotAggregate = { demoCount: 0, nonDemoCount: 0, totalCount: 0 };

afterEach(() => {
  queries.length = 0;
  snapshotRows = [];
  selectedZone = { id: selectedZoneId };
  queryRaw.mockClear();
  findUnique.mockClear();
});

test("does not substitute current carbon when the requested period predates snapshots", async () => {
  const toExclusive = new Date("2020-02-01T17:00:00.000Z");
  const reportSource = await getMrvReportSource(
    {
      range: {
        from: new Date("2020-01-01T17:00:00.000Z"),
        fromDate: "2020-01-02",
        toDate: "2020-02-01",
        toExclusive,
      },
      zoneId: null,
    },
    new Date("2026-11-16T00:00:00.000Z"),
  );

  const carbonQuery = queries.find(({ sql }) =>
    sql.includes("forest_zone_carbon_snapshots"),
  );

  expect(reportSource).toMatchObject({
    carbonSnapshotAsOf: "2020-02-01T16:59:59.999Z",
    hasCarbonSnapshot: false,
    zones: [],
  });
  expect(carbonQuery?.sql).toContain("snapshot.captured_at < ?");
  expect(carbonQuery?.values).toContain(toExclusive);
});

test("keeps an unapproved zone's recorded history and returns zero approved zones", async () => {
  selectedZone = { id: selectedZoneId };
  snapshotRows = [
    {
      areaHectares: 50,
      biomassFactor: 25,
      co2ConversionFactor: 3.67,
      emissionFactor: 0.2,
      incentivePerTonIdr: 15_000,
      isDemoData: false,
      isParameterDemoData: false,
      isZoneApproved: false,
      name: "Operator configured",
      parameterSetId: "62000000-0000-4000-8000-000000000001",
      snapshotAt: new Date("2026-11-10T00:00:00.000Z"),
      snapshotReason: "ZONE_UPDATED",
      villageName: "Desa Contoh",
      zoneId: selectedZoneId,
      zoneName: "Zona Contoh",
    },
  ];

  const reportSource = await getMrvReportSource(
    {
      range: null,
      zoneId: selectedZoneId,
    },
    new Date("2026-11-16T00:00:00.000Z"),
  );

  expect(findUnique).toHaveBeenCalledWith({
    where: { id: selectedZoneId },
    select: { id: true },
  });
  expect(reportSource).toMatchObject({
    hasCarbonSnapshot: true,
    zones: [],
  });
  const hotspotQuery = queries.find(({ sql }) =>
    sql.includes("FROM satellite_hotspots"),
  );
  expect(hotspotQuery?.sql).toContain(
    "ST_Intersects(zone.boundary, hotspot.location)",
  );
  expect(hotspotQuery?.sql).not.toContain("zone.is_approved");
});

test("returns unavailable history when the requested zone has not existed yet", async () => {
  selectedZone = { id: selectedZoneId };
  snapshotRows = [];

  const reportSource = await getMrvReportSource(
    {
      range: null,
      zoneId: selectedZoneId,
    },
    new Date("2020-01-01T00:00:00.000Z"),
  );

  expect(reportSource).toMatchObject({
    hasCarbonSnapshot: false,
    zones: [],
  });
});
