import { expect, test } from "bun:test";
import { assertExpectedReportOwner } from "@/lib/server/reports/input";
import { reportErrorResponse } from "@/lib/server/reports/http";

const ownerId = "70000000-0000-4000-8000-000000000001";
const otherId = "70000000-0000-4000-8000-000000000099";

test("accepts a draft only when the required UUID matches the authenticated owner", async () => {
  const request = new FormData();
  expect(() => assertExpectedReportOwner(request, ownerId)).toThrow();
  request.set("expectedOwnerId", ownerId);
  expect(() => assertExpectedReportOwner(request, ownerId)).not.toThrow();

  try {
    assertExpectedReportOwner(request, otherId);
    throw new Error("Cross-account draft was accepted");
  } catch (error) {
    const response = reportErrorResponse(error);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: "report_owner_mismatch",
    });
  }

  request.append("expectedOwnerId", otherId);
  expect(() => assertExpectedReportOwner(request, ownerId)).toThrow();
});
