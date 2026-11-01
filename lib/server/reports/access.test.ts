import { describe, expect, test } from "bun:test";

import {
  assertCanChangeReportStatus,
  assertCanCreateReport,
  assertCanReadReports,
  isLocalDemoVolunteer,
  reportActorFromSession,
  reportReadScope,
  type ReportActor,
} from "@/lib/server/reports/access";
import { AuthorizationError } from "@/lib/role-access";

const relawan: ReportActor = {
  id: "70000000-0000-4000-8000-000000000001",
  email: "relawan.demo@peatguard.local",
  role: "RELAWAN",
};

describe("report access rules", () => {
  test("scopes volunteer detail reads to that volunteer's reports", () => {
    expect(reportReadScope(relawan)).toEqual({ reporterId: relawan.id });
    expect(reportReadScope({ ...relawan, id: "another-user" })).toEqual({
      reporterId: "another-user",
    });
  });

  test("allows POSKO and verifiers to read private report details", () => {
    expect(reportReadScope({ ...relawan, role: "POSKO" })).toEqual({});
    expect(reportReadScope({ ...relawan, role: "VERIFIKATOR" })).toEqual({});
  });

  test("only volunteers create reports and only POSKO changes status", () => {
    expect(() => assertCanCreateReport(relawan)).not.toThrow();
    expect(() => assertCanCreateReport({ ...relawan, role: "POSKO" })).toThrow(
      AuthorizationError,
    );
    expect(() =>
      assertCanChangeReportStatus({ ...relawan, role: "POSKO" }),
    ).not.toThrow();
    expect(() => assertCanChangeReportStatus(relawan)).toThrow(
      AuthorizationError,
    );
  });

  test("rejects an invalid session role and limits demo samples to the local demo account", () => {
    expect(() => reportActorFromSession({ ...relawan, role: "ADMIN" })).toThrow(
      AuthorizationError,
    );
    expect(isLocalDemoVolunteer(relawan, "1", "development")).toBe(true);
    expect(isLocalDemoVolunteer(relawan, "1", "production")).toBe(false);
    expect(isLocalDemoVolunteer(relawan, "0", "development")).toBe(false);
    expect(
      isLocalDemoVolunteer({ ...relawan, email: "field@example.test" }),
    ).toBe(false);
    expect(isLocalDemoVolunteer({ ...relawan, role: "POSKO" })).toBe(false);
  });

  test("does not grant access to unauthenticated or roleless actors", () => {
    expect(() =>
      reportActorFromSession({ id: "", email: "", role: null }),
    ).toThrow(AuthorizationError);
    expect(() =>
      assertCanReadReports({ ...relawan, role: "RELAWAN" }),
    ).not.toThrow();
  });
});
