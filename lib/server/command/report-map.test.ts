import { afterEach, expect, mock, test } from "bun:test";

import { AuthorizationError } from "@/lib/role-access";
import { parseReportMapFilters } from "@/lib/server/command/report-map-input";

let rows: unknown[] = [];
let queryCount = 0;
const queryRaw = mock(async () => {
  queryCount += 1;
  return rows;
});

mock.module("@/lib/prisma", () => ({
  prisma: { $queryRaw: queryRaw },
}));

const { COMMAND_REPORT_MAP_POINT_LIMIT, getCommandReportMapPoints } =
  await import("@/lib/server/command/report-map");

afterEach(() => {
  rows = [];
  queryCount = 0;
  queryRaw.mockClear();
});

test("requires POSKO role before querying private report coordinates", async () => {
  const filters = parseFilters();

  await expect(
    getCommandReportMapPoints("RELAWAN", filters),
  ).rejects.toBeInstanceOf(AuthorizationError);
  expect(queryCount).toBe(0);
});

test("limits viewport results and reports truncation without private columns", async () => {
  rows = Array.from(
    { length: COMMAND_REPORT_MAP_POINT_LIMIT + 1 },
    (_, index) => ({
      id: `70000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      latitude: -1.25,
      longitude: 114.75,
      capturedAt: new Date("2026-11-15T02:00:00.000Z"),
      aiUrgency: "WASPADA",
      aiCategory: "ASAP_GAMBUT",
      handlingStatus: "MENUNGGU_TINDAKAN",
      isDemoSample: false,
      fieldNotes: "must not be returned",
      reporterId: "must not be returned",
    }),
  );

  const result = await getCommandReportMapPoints("POSKO", parseFilters());

  expect(queryCount).toBe(1);
  expect(result.points).toHaveLength(COMMAND_REPORT_MAP_POINT_LIMIT);
  expect(result.truncated).toBe(true);
  expect(result.limit).toBe(COMMAND_REPORT_MAP_POINT_LIMIT);
  expect(Object.keys(result.points[0]).sort()).toEqual([
    "aiCategory",
    "aiUrgency",
    "capturedAt",
    "handlingStatus",
    "id",
    "isDemoSample",
    "latitude",
    "longitude",
  ]);
  expect(result.points[0].capturedAt).toBe("2026-11-15T02:00:00.000Z");
});

function parseFilters() {
  return parseReportMapFilters(
    new URLSearchParams("west=113&south=-3&east=116&north=-1"),
  );
}
