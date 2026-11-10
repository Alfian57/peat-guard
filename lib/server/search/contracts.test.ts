import { describe, expect, it } from "bun:test";

import {
  buildReportSearchWhere,
  canSearchScope,
  toGlobalSearchReportResult,
} from "./contracts";

describe("global search access and result contracts", () => {
  it("scopes volunteer reports to the session owner", () => {
    const where = buildReportSearchWhere("zona", "RELAWAN", "volunteer-1");
    expect(where.reporterId).toBe("volunteer-1");
  });

  it("does not restrict POSKO or verifier report search to one reporter", () => {
    expect(buildReportSearchWhere("zona", "POSKO", "posko-1").reporterId).toBe(
      undefined,
    );
    expect(
      buildReportSearchWhere("zona", "VERIFIKATOR", "verifier-1").reporterId,
    ).toBe(undefined);
  });

  it("exposes command data only to POSKO and audit data only to verifiers", () => {
    expect(canSearchScope("RELAWAN", "command-data")).toBe(false);
    expect(canSearchScope("RELAWAN", "audit-data")).toBe(false);
    expect(canSearchScope("POSKO", "command-data")).toBe(true);
    expect(canSearchScope("POSKO", "audit-data")).toBe(false);
    expect(canSearchScope("VERIFIKATOR", "command-data")).toBe(false);
    expect(canSearchScope("VERIFIKATOR", "audit-data")).toBe(true);
  });

  it("returns minimal report results without private evidence or identity", () => {
    const result = toGlobalSearchReportResult(
      {
        id: "61000000-0000-4000-8000-000000000001",
        handlingStatus: "DALAM_PENANGANAN",
        isDemoSample: false,
        zone: { zoneName: "Zona Sungai", villageName: "Desa Harapan" },
      },
      "RELAWAN",
    );
    expect(Object.keys(result).sort()).toEqual([
      "description",
      "href",
      "id",
      "kind",
      "title",
    ]);
    expect(result.href).toBe(
      "/field/reports/61000000-0000-4000-8000-000000000001",
    );
    expect(result.description).not.toContain("fieldNotes");
    expect(result.description).not.toContain("reporter");
  });
});
