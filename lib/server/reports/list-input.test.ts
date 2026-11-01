import { describe, expect, test } from "bun:test";

import { parseReportListFilters } from "@/lib/server/reports/list-input";
import { ReportInputError } from "@/lib/server/reports/input";

describe("field report list filters", () => {
  test("uses bounded pagination defaults and inclusive WIB calendar dates", () => {
    const filters = parseReportListFilters(
      new URLSearchParams(
        "page=2&pageSize=50&status=DALAM_PENANGANAN&zoneId=70000000-0000-4000-8000-000000000001&from=2026-11-15&to=2026-11-16&isDemoSample=true",
      ),
    );

    expect(filters.page).toBe(2);
    expect(filters.pageSize).toBe(50);
    expect(filters.status).toBe("DALAM_PENANGANAN");
    expect(filters.zoneId).toBe("70000000-0000-4000-8000-000000000001");
    expect(filters.from?.toISOString()).toBe("2026-11-14T17:00:00.000Z");
    expect(filters.toExclusive?.toISOString()).toBe("2026-11-16T17:00:00.000Z");
    expect(filters.isDemoSample).toBe(true);

    const defaults = parseReportListFilters(new URLSearchParams());
    expect(defaults.page).toBe(1);
    expect(defaults.pageSize).toBe(25);
    expect(defaults.status).toBeNull();
    expect(defaults.from).toBeNull();
    expect(defaults.toExclusive).toBeNull();
    expect(defaults.isDemoSample).toBeNull();
  });

  test("rejects duplicate, unknown, malformed, and out-of-range filters", () => {
    const invalidQueries = [
      "page=1&page=2",
      "unexpected=true",
      "page=0",
      "pageSize=101",
      "status=UNKNOWN",
      "zoneId=not-a-uuid",
      "from=2026-02-30",
      "from=2026-11-16&to=2026-11-15",
      "isDemoSample=yes",
    ];

    for (const query of invalidQueries) {
      expect(() => parseReportListFilters(new URLSearchParams(query))).toThrow(
        ReportInputError,
      );
    }
  });
});
