import { describe, expect, test } from "bun:test";

import {
  parseDashboardFilters,
  parseEvidenceReviewRequest,
  parseLedgerExportFilters,
  parseLedgerFilters,
  parseMrvReportRequest,
} from "@/lib/server/mrv/validation";

describe("MRV query validation", () => {
  test("accepts only one supported human evidence review decision", () => {
    expect(parseEvidenceReviewRequest({ decision: "ACCEPTED" })).toEqual({
      ok: true,
      value: { decision: "ACCEPTED" },
    });
    expect(parseEvidenceReviewRequest({ decision: "NEEDS_FOLLOW_UP" }).ok).toBe(
      false,
    );
    expect(
      parseEvidenceReviewRequest({
        decision: "NEEDS_FOLLOW_UP",
        note: " Periksa ulang. ",
      }),
    ).toEqual({
      ok: true,
      value: { decision: "NEEDS_FOLLOW_UP", note: "Periksa ulang." },
    });
    expect(parseEvidenceReviewRequest({ decision: "VERIFIED_GPS" }).ok).toBe(
      false,
    );
    expect(
      parseEvidenceReviewRequest({
        decision: "ACCEPTED",
        unsupported: "not an accepted review field",
      }).ok,
    ).toBe(false);
  });

  test("interprets date filters as inclusive calendar days in WIB", () => {
    const result = parseDashboardFilters(
      new URLSearchParams("from=2026-11-01&to=2026-11-15"),
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.range?.from?.toISOString()).toBe(
      "2026-10-31T17:00:00.000Z",
    );
    expect(result.value.range?.toExclusive?.toISOString()).toBe(
      "2026-11-15T17:00:00.000Z",
    );
    expect(result.value.range?.fromDate).toBe("2026-11-01");
    expect(result.value.range?.toDate).toBe("2026-11-15");
  });

  test("rejects partial, impossible, and reversed date ranges", () => {
    expect(
      parseDashboardFilters(new URLSearchParams("from=2026-11-01")).ok,
    ).toBe(false);
    expect(
      parseDashboardFilters(
        new URLSearchParams("from=2026-02-30&to=2026-03-01"),
      ).ok,
    ).toBe(false);
    expect(
      parseDashboardFilters(
        new URLSearchParams("from=2026-11-16&to=2026-11-15"),
      ).ok,
    ).toBe(false);
  });

  test("rejects repeated query keys and malformed zone IDs", () => {
    expect(parseLedgerFilters(new URLSearchParams("page=1&page=2")).ok).toBe(
      false,
    );
    expect(
      parseLedgerFilters(new URLSearchParams("zoneId=not-a-uuid")).ok,
    ).toBe(false);
  });

  test("treats empty optional form fields as absent filters", () => {
    expect(
      parseLedgerFilters(new URLSearchParams("zoneId=&aiState=&from=&to=")),
    ).toEqual({
      ok: true,
      value: {
        aiState: null,
        evidence: "all",
        page: 1,
        pageSize: 25,
        range: null,
        reportId: null,
        zoneId: null,
      },
    });
    expect(
      parseDashboardFilters(new URLSearchParams("from=&to=&zoneId=")),
    ).toEqual({ ok: true, value: { range: null } });
    expect(
      parseLedgerFilters(new URLSearchParams("from=&to=2026-11-15")).ok,
    ).toBe(false);
  });

  test("validates page, pageSize, and AI state filters", () => {
    expect(
      parseLedgerFilters(new URLSearchParams("page=0&pageSize=25")).ok,
    ).toBe(false);
    expect(
      parseLedgerFilters(new URLSearchParams("page=1&pageSize=101")).ok,
    ).toBe(false);
    expect(parseLedgerFilters(new URLSearchParams("aiState=UNKNOWN")).ok).toBe(
      false,
    );

    const valid = parseLedgerFilters(
      new URLSearchParams("page=2&pageSize=50&aiState=COMPLETED"),
    );

    expect(valid).toEqual({
      ok: true,
      value: {
        aiState: "COMPLETED",
        evidence: "all",
        page: 2,
        pageSize: 50,
        range: null,
        reportId: null,
        zoneId: null,
      },
    });
  });

  test("requires an explicit JSON or CSV export format", () => {
    expect(parseLedgerExportFilters(new URLSearchParams()).ok).toBe(false);
    expect(
      parseLedgerExportFilters(new URLSearchParams("format=xlsx")).ok,
    ).toBe(false);
    expect(parseLedgerExportFilters(new URLSearchParams("format=csv")).ok).toBe(
      true,
    );
  });

  test("filters photo and coordinate completeness independently of AI state", () => {
    const valid = parseLedgerFilters(new URLSearchParams("evidence=complete"));

    expect(valid.ok).toBe(true);

    if (valid.ok) {
      expect(valid.value.evidence).toBe("complete");
    }

    expect(
      parseLedgerFilters(new URLSearchParams("evidence=verified")).ok,
    ).toBe(false);
    expect(
      parseLedgerFilters(
        new URLSearchParams("evidence=complete&aiState=SKIPPED"),
      ).ok,
    ).toBe(true);
  });

  test("accepts only bounded report filters and explicit narrative consent", () => {
    const valid = parseMrvReportRequest(
      {
        aiConsent: true,
        documentType: "CARBON_AUDIT",
        from: "2026-11-01",
        includeNarrative: true,
        to: "2026-11-30",
        zoneId: "61000000-0000-4000-8000-000000000001",
      },
      new Date("2026-11-20"),
    );

    expect(valid.ok).toBe(true);

    if (valid.ok) {
      expect(valid.value.aiConsent).toBe(true);
      expect(valid.value.documentType).toBe("CARBON_AUDIT");
      expect(valid.value.filters.zoneId).toBe(
        "61000000-0000-4000-8000-000000000001",
      );
      expect(valid.value.filters.range?.fromDate).toBe("2026-11-01");
    }

    expect(parseMrvReportRequest({ includeNarrative: true })).toEqual({
      error:
        "AI narrative generation requires explicit aiConsent=true and includeNarrative=true.",
      ok: false,
    });
    expect(
      parseMrvReportRequest({ prompt: "include private field report details" }),
    ).toEqual({
      error: "Request body contains an unsupported field.",
      ok: false,
    });
    expect(
      parseMrvReportRequest({
        aiConsent: false,
        includeNarrative: false,
        from: "2026-02-30",
        to: "2026-03-01",
      }).ok,
    ).toBe(false);

    expect(parseMrvReportRequest({ documentType: "UNSUPPORTED" }).ok).toBe(
      false,
    );
  });
});
