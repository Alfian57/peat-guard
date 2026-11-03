import { expect, test } from "bun:test";

import { buildReportMapQuery } from "@/components/command/reports/report-map-query";

test("includes a rounded viewport and all supported incident filters", () => {
  const query = new URLSearchParams(
    buildReportMapQuery(
      {
        west: 113.123456,
        south: -2.765432,
        east: 115.987654,
        north: -1.234567,
      },
      {
        from: "2026-11-01",
        to: "2026-11-15",
        status: "DALAM_PENANGANAN",
        urgency: "UNRATED",
      },
    ),
  );

  expect(query.get("west")).toBe("113.12346");
  expect(query.get("south")).toBe("-2.76543");
  expect(query.get("east")).toBe("115.98765");
  expect(query.get("north")).toBe("-1.23457");
  expect(query.get("from")).toBe("2026-11-01");
  expect(query.get("to")).toBe("2026-11-15");
  expect(query.get("status")).toBe("DALAM_PENANGANAN");
  expect(query.get("urgency")).toBe("UNRATED");
});
