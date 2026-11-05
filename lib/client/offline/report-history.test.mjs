import { describe, expect, it } from "bun:test";
import {
  findLocalReportForServer,
  parseServerReportDetail,
  parseServerReportPage,
  resolveReportDetailSource,
  shouldFetchServerReports,
  splitReportHistory,
} from "./server-report-client.ts";

const serverReportId = "2d2e7921-49e4-4e78-b5c7-7b5008f93bd9";
const clientReportId = "f2f5b58a-f0ab-4b54-852c-2ad682d1f84f";

function summary(overrides = {}) {
  return {
    id: serverReportId,
    zoneId: null,
    latitude: -2.3194,
    longitude: 113.9102,
    accuracyMeters: 8,
    capturedAt: "2026-11-15T09:30:00.000Z",
    syncedAt: "2026-11-15T09:35:00.000Z",
    handlingStatus: "MENUNGGU_TINDAKAN",
    aiState: "COMPLETED",
    aiCategory: "ASAP_GAMBUT",
    aiUrgency: "WASPADA",
    isDemoSample: false,
    hasPhoto: true,
    photoHref: `/api/reports/${serverReportId}/photo`,
    ...overrides,
  };
}

function detail(overrides = {}) {
  return {
    ...summary(),
    clientReportId,
    fieldNotes: "Asap tipis terlihat dekat kanal.",
    tags: ["Asap", "Kanal"],
    aiConsent: true,
    aiConfidence: 0.91,
    aiSummary: "Terlihat asap tipis dari lahan gambut.",
    aiVisualIndicators: ["Asap tipis", "Vegetasi kering"],
    aiFalsePositiveCheck: "Tidak tampak seperti kabut rendah.",
    aiActionRecommendations: ["Hubungi posko", "Hindari masuk ke area"],
    aiAnalyzedAt: "2026-11-15T09:36:00.000Z",
    nearestWaterDistanceM: 180.5,
    createdAt: "2026-11-15T09:35:00.000Z",
    updatedAt: "2026-11-15T09:36:00.000Z",
    statusEvents: [
      {
        id: "status-event-1",
        previousStatus: null,
        nextStatus: "MENUNGGU_TINDAKAN",
        note: null,
        createdAt: "2026-11-15T09:35:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("volunteer server report history contract", () => {
  it("runtime-validates list and private report detail DTOs", () => {
    const page = parseServerReportPage({
      reports: [summary()],
      page: 1,
      pageSize: 25,
      total: 1,
    });
    const report = parseServerReportDetail(detail());

    expect(page.reports[0].id).toBe(serverReportId);
    expect(report.aiActionRecommendations).toEqual([
      "Hubungi posko",
      "Hindari masuk ke area",
    ]);
    expect(report.statusEvents[0].nextStatus).toBe("MENUNGGU_TINDAKAN");
  });

  it("rejects malformed enum values and photo links outside the private route", () => {
    expect(() =>
      parseServerReportPage({
        reports: [summary({ handlingStatus: "OTHER" })],
        page: 1,
        pageSize: 25,
        total: 1,
      }),
    ).toThrow("Respons laporan dari server tidak valid.");
    expect(() =>
      parseServerReportDetail(
        detail({ photoHref: "https://outside.example/photo.webp" }),
      ),
    ).toThrow("Respons laporan dari server tidak valid.");
    expect(() => parseServerReportDetail(detail({ hasPhoto: false }))).toThrow(
      "Respons laporan dari server tidak valid.",
    );
  });

  it("accepts nullable AI JSON fields when a volunteer skipped analysis", () => {
    const report = parseServerReportDetail(
      detail({
        aiConsent: false,
        aiState: "SKIPPED",
        aiCategory: null,
        aiUrgency: null,
        aiConfidence: null,
        aiSummary: null,
        aiVisualIndicators: null,
        aiFalsePositiveCheck: null,
        aiActionRecommendations: null,
        aiAnalyzedAt: null,
      }),
    );

    expect(report.aiState).toBe("SKIPPED");
    expect(report.aiVisualIndicators).toBeNull();
    expect(report.aiActionRecommendations).toBeNull();
  });

  it("accepts a valid server detail with no stored photo", () => {
    const report = parseServerReportDetail(
      detail({ hasPhoto: false, photoHref: null }),
    );

    expect(report.hasPhoto).toBe(false);
    expect(report.photoHref).toBeNull();
  });

  it("only requests server history for an online authenticated field owner", () => {
    expect(
      shouldFetchServerReports({
        ownerId: "volunteer-1",
        ownerStatus: "authenticated",
        isConnected: true,
      }),
    ).toBe(true);
    for (const input of [
      {
        ownerId: "volunteer-1",
        ownerStatus: "offline-known",
        isConnected: true,
      },
      { ownerId: "volunteer-1", ownerStatus: "role-denied", isConnected: true },
      {
        ownerId: "volunteer-1",
        ownerStatus: "authenticated",
        isConnected: false,
      },
      { ownerId: null, ownerStatus: "authenticated", isConnected: true },
    ]) {
      expect(shouldFetchServerReports(input)).toBe(false);
    }
  });

  it("deduplicates local synced reports already present in server history", () => {
    const localReports = [
      {
        clientReportId: "local-synced",
        serverReportId,
        syncState: "synced",
      },
      {
        clientReportId: "local-pending",
        serverReportId: null,
        syncState: "pending",
      },
      {
        clientReportId: "local-sent-not-in-page",
        serverReportId: "d6f00641-19ae-4acf-a45b-5022bba39d17",
        syncState: "synced",
      },
    ];
    const history = splitReportHistory([summary()], localReports);

    expect(
      history.outboxReports.map((report) => report.clientReportId),
    ).toEqual(["local-pending"]);
    expect(
      history.localSentFallback.map((report) => report.clientReportId),
    ).toEqual(["local-sent-not-in-page"]);
    expect(findLocalReportForServer(serverReportId, localReports)).toBe(
      localReports[0],
    );
  });

  it("uses the server detail online and the owner-scoped local row offline", () => {
    const localReport = {
      clientReportId,
      serverReportId,
      syncState: "synced",
      aiState: "pending",
    };
    const serverDetail = parseServerReportDetail(detail());

    expect(
      resolveReportDetailSource({
        isConnected: true,
        serverReport: serverDetail,
        localReport,
      }).kind,
    ).toBe("server");
    expect(
      resolveReportDetailSource({
        isConnected: false,
        serverReport: null,
        localReport,
      }),
    ).toEqual({ kind: "local", report: localReport });
    expect(
      resolveReportDetailSource({
        isConnected: false,
        serverReport: serverDetail,
        localReport: null,
      }).kind,
    ).toBe("unavailable");
  });
});
