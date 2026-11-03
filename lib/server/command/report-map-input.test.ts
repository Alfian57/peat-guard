import { describe, expect, test } from "bun:test";

import { parseReportMapFilters } from "@/lib/server/command/report-map-input";
import { CommandApiError } from "@/lib/server/command/http";

describe("POSKO report map filters", () => {
  test("parses viewport, inclusive WIB dates, status, and urgency", () => {
    const filters = parseReportMapFilters(
      new URLSearchParams(
        "west=113.5&south=-2.5&east=115&north=-1&from=2026-11-15&to=2026-11-16&status=DALAM_PENANGANAN&urgency=KRITIS",
      ),
    );

    expect(filters).toEqual({
      west: 113.5,
      south: -2.5,
      east: 115,
      north: -1,
      from: new Date("2026-11-14T17:00:00.000Z"),
      toExclusive: new Date("2026-11-16T17:00:00.000Z"),
      status: "DALAM_PENANGANAN",
      urgency: "KRITIS",
    });
  });

  test("supports the unrated urgency filter and no optional filters", () => {
    const filters = parseReportMapFilters(
      new URLSearchParams("west=100&south=-5&east=120&north=5&urgency=UNRATED"),
    );

    expect(filters.urgency).toBe("UNRATED");
    expect(filters.status).toBeNull();
    expect(filters.from).toBeNull();
    expect(filters.toExclusive).toBeNull();
  });

  test("rejects missing bounds, invalid ranges, dates, and duplicate or unknown keys", () => {
    const invalidQueries = [
      "south=-5&east=120&north=5",
      "west=120&south=-5&east=100&north=5",
      "west=100&south=6&east=120&north=5",
      "west=-181&south=-5&east=120&north=5",
      "west=100&south=-5&east=120&north=5&from=2026-02-30",
      "west=100&south=-5&east=120&north=5&from=2026-11-16&to=2026-11-15",
      "west=100&west=101&south=-5&east=120&north=5",
      "west=100&south=-5&east=120&north=5&other=value",
      "west=100&south=-5&east=120&north=5&status=UNKNOWN",
      "west=100&south=-5&east=120&north=5&urgency=UNKNOWN",
    ];

    for (const query of invalidQueries) {
      expect(() => parseReportMapFilters(new URLSearchParams(query))).toThrow(
        CommandApiError,
      );
    }
  });
});
