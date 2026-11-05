import { describe, expect, it } from "bun:test";
import {
  filterReportsForOwner,
  isActiveOwnerMatch,
  isActiveVolunteerOwnerMatch,
  isFieldRoleDenied,
  isFieldVolunteerRole,
  isSessionAuthDenied,
  persistLastKnownOwner,
  reportBelongsToOwner,
} from "./owner-store.ts";
import { isRemovableLocalDraft, saveQueuedReport } from "./report-store.ts";
import { canUseDemoSamples } from "./demo-samples.ts";

const reports = [
  { clientReportId: "report-a1", ownerId: "user-a" },
  { clientReportId: "report-b1", ownerId: "user-b" },
  { clientReportId: "legacy-report", ownerId: undefined },
];

describe("offline report owner isolation", () => {
  it("lists only reports owned by the requested user", () => {
    expect(filterReportsForOwner(reports, "user-a")).toEqual([reports[0]]);
    expect(filterReportsForOwner(reports, "user-b")).toEqual([reports[1]]);
    expect(reportBelongsToOwner(reports[2], "user-a")).toBe(false);
  });

  it("denies detail and edit access when a report belongs to another user", () => {
    expect(reportBelongsToOwner(reports[0], "user-a")).toBe(true);
    expect(reportBelongsToOwner(reports[1], "user-a")).toBe(false);
    expect(reportBelongsToOwner(undefined, "user-a")).toBe(false);
  });

  it("refuses to save a report under a different active account", async () => {
    await expect(saveQueuedReport(reports[0], "user-b")).rejects.toThrow(
      "Laporan ini tidak cocok dengan akun pemilik yang sedang aktif.",
    );
  });

  it("allows deleting only an unsynced local draft", () => {
    expect(
      isRemovableLocalDraft({ syncState: "pending", serverReportId: null }),
    ).toBe(true);
    expect(
      isRemovableLocalDraft({ syncState: "failed", serverReportId: null }),
    ).toBe(true);
    expect(
      isRemovableLocalDraft({ syncState: "syncing", serverReportId: null }),
    ).toBe(false);
    expect(
      isRemovableLocalDraft({
        syncState: "synced",
        serverReportId: "server-id",
      }),
    ).toBe(false);
  });

  it("allows sync only for a matching active session and stored owner", () => {
    expect(isActiveOwnerMatch("user-a", "user-a")).toBe(true);
    expect(isActiveOwnerMatch("user-a", "user-b")).toBe(false);
    expect(isActiveOwnerMatch("user-a", null)).toBe(false);
    expect(isActiveOwnerMatch("", "user-a")).toBe(false);
  });

  it("rejects POSKO and VERIFIKATOR sessions from field access and sync", () => {
    for (const role of ["POSKO", "VERIFIKATOR"]) {
      expect(isFieldVolunteerRole(role)).toBe(false);
      expect(isFieldRoleDenied(true, role)).toBe(true);
      expect(isActiveVolunteerOwnerMatch("user-a", "user-a", role)).toBe(false);
    }
    expect(isFieldRoleDenied(false, null)).toBe(false);
    expect(isActiveVolunteerOwnerMatch("user-a", "user-a", "RELAWAN")).toBe(
      true,
    );
  });

  it("does not persist a non-volunteer as the offline owner", () => {
    expect(persistLastKnownOwner("user-b", "POSKO")).toBe(false);
    expect(persistLastKnownOwner("user-c", "VERIFIKATOR")).toBe(false);
  });

  it("blocks offline owner fallback on explicit authentication denial", () => {
    expect(isSessionAuthDenied(401)).toBe(true);
    expect(isSessionAuthDenied(403)).toBe(true);
    expect(isSessionAuthDenied(500)).toBe(false);
  });

  it("limits demo sample reports to the local demo RELAWAN account", () => {
    const demoVolunteer = {
      demoLoginEnabled: true,
      ownerId: "70000000-0000-4000-8000-000000000001",
      hasVerifiedDemoSession: true,
      offlineKnownVolunteerOwner: false,
      sessionEmail: "relawan.demo@peatguard.local",
    };
    expect(canUseDemoSamples(demoVolunteer)).toBe(true);
    expect(
      canUseDemoSamples({ ...demoVolunteer, demoLoginEnabled: false }),
    ).toBe(false);
    expect(
      canUseDemoSamples({ ...demoVolunteer, ownerId: "another-volunteer" }),
    ).toBe(false);
    expect(
      canUseDemoSamples({
        ...demoVolunteer,
        hasVerifiedDemoSession: false,
        offlineKnownVolunteerOwner: true,
        sessionEmail: null,
      }),
    ).toBe(true);
  });
});
