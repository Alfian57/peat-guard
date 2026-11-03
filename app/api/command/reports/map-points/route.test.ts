import { afterEach, expect, mock, test } from "bun:test";

import { AuthorizationError } from "@/lib/role-access";

let allowAccess = false;
let serviceCallCount = 0;
let receivedFilters: unknown;
const mockGetPoints = mock(async (_role: unknown, filters: unknown) => {
  serviceCallCount += 1;
  receivedFilters = filters;
  return { points: [], truncated: false, limit: 250 };
});

mock.module("@/lib/authz", () => ({
  requireRole: async () => {
    if (!allowAccess) throw new AuthorizationError(403);
    return { user: { role: "POSKO" } };
  },
}));
mock.module("@/lib/server/command/report-map", () => ({
  getCommandReportMapPoints: mockGetPoints,
}));

const { GET } = await import("@/app/api/command/reports/map-points/route");

afterEach(() => {
  allowAccess = false;
  serviceCallCount = 0;
  receivedFilters = undefined;
  mockGetPoints.mockClear();
});

test("denies requests without the POSKO role", async () => {
  const response = await GET(
    new Request(
      "http://localhost/api/command/reports/map-points?west=113&south=-3&east=116&north=-1",
    ),
  );

  expect(response.status).toBe(403);
  expect(serviceCallCount).toBe(0);
});

test("returns bounded report pins as an uncached private map response", async () => {
  allowAccess = true;
  const response = await GET(
    new Request(
      "http://localhost/api/command/reports/map-points?west=113&south=-3&east=116&north=-1&status=SELESAI&urgency=UNRATED",
    ),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(serviceCallCount).toBe(1);
  expect(receivedFilters).toMatchObject({
    west: 113,
    south: -3,
    east: 116,
    north: -1,
    status: "SELESAI",
    urgency: "UNRATED",
  });
  expect(await response.json()).toEqual({
    points: [],
    truncated: false,
    limit: 250,
  });
});

test("rejects malformed viewport input before reading report rows", async () => {
  allowAccess = true;
  const response = await GET(
    new Request(
      "http://localhost/api/command/reports/map-points?west=116&south=-3&east=113&north=-1",
    ),
  );

  expect(response.status).toBe(400);
  expect(serviceCallCount).toBe(0);
});
