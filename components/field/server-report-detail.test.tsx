import { expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { parseServerReportDetail } from "@/lib/client/offline/server-report-client";

mock.module("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

const { ServerReportDetail } =
  await import("@/components/field/server-report-detail");

test("shows a clear evidence state for a valid detail without a photo", () => {
  const report = parseServerReportDetail({
    id: "2d2e7921-49e4-4e78-b5c7-7b5008f93bd9",
    clientReportId: "f2f5b58a-f0ab-4b54-852c-2ad682d1f84f",
    zoneId: null,
    latitude: -2.3194,
    longitude: 113.9102,
    accuracyMeters: 8,
    capturedAt: "2026-11-15T09:30:00.000Z",
    syncedAt: "2026-11-15T09:35:00.000Z",
    handlingStatus: "MENUNGGU_TINDAKAN",
    aiState: "SKIPPED",
    aiCategory: null,
    aiUrgency: null,
    isDemoSample: false,
    hasPhoto: false,
    photoHref: null,
    fieldNotes: null,
    tags: [],
    aiConsent: false,
    aiConfidence: null,
    aiSummary: null,
    aiVisualIndicators: null,
    aiFalsePositiveCheck: null,
    aiActionRecommendations: null,
    aiAnalyzedAt: null,
    nearestWaterDistanceM: null,
    createdAt: "2026-11-15T09:35:00.000Z",
    updatedAt: "2026-11-15T09:35:00.000Z",
    statusEvents: [],
  });

  render(<ServerReportDetail report={report} />);

  expect(screen.getByText("Laporan ini tidak menyertakan foto.")).toBeTruthy();
  expect(
    screen.queryByRole("img", { name: "Foto laporan patroli" }),
  ).toBeNull();
});
