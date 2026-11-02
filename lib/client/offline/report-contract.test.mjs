import { describe, expect, it } from "bun:test";
import {
  buildReportFormData,
  createClientReportId,
  createQueuedReport,
  getSyncFailureMessage,
  readServerReportId,
} from "./report-contract.ts";

const clientReportId = "f2f5b58a-f0ab-4b54-852c-2ad682d1f84f";
const serverReportId = "2d2e7921-49e4-4e78-b5c7-7b5008f93bd9";
const reportInput = {
  capturedAt: "2026-11-15T09:30:00.000Z",
  latitude: -2.3194,
  longitude: 113.9102,
  accuracyMeters: null,
  fieldNotes: "Asap tipis terlihat dari tepi kanal.",
  tags: ["Asap", "Kanal"],
  aiConsent: false,
  isDemoSample: true,
  photo: new Blob(["demo-photo"], { type: "image/webp" }),
  photoName: "asap-gambut.webp",
  photoType: "image/webp",
};

describe("field report client contract", () => {
  it("creates a stable local record and marks AI as skipped without consent", () => {
    const report = createQueuedReport(
      reportInput,
      "user-owner-1",
      clientReportId,
      "2026-11-15T09:31:00.000Z",
    );

    expect(report.ownerId).toBe("user-owner-1");
    expect(report.clientReportId).toBe(clientReportId);
    expect(report.createdAt).toBe("2026-11-15T09:31:00.000Z");
    expect(report.syncState).toBe("pending");
    expect(report.aiState).toBe("skipped");
    expect(report.syncError).toBeNull();
  });

  it("refuses to create an offline record without a known owner", () => {
    expect(() => createQueuedReport(reportInput, "")).toThrow(
      "Masuk online sekali untuk mengaktifkan laporan offline.",
    );
  });

  it("generates a UUID accepted by the report API", () => {
    expect(createClientReportId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("serializes report data but keeps the local owner ID off the API contract", () => {
    const report = createQueuedReport(
      reportInput,
      "user-owner-1",
      clientReportId,
    );
    const formData = buildReportFormData(report);
    const photo = formData.get("photo");

    expect(formData.get("clientReportId")).toBe(clientReportId);
    expect(formData.get("capturedAt")).toBe(reportInput.capturedAt);
    expect(formData.get("latitude")).toBe(String(reportInput.latitude));
    expect(formData.get("longitude")).toBe(String(reportInput.longitude));
    expect(formData.get("accuracyMeters")).toBe("");
    expect(formData.get("tags")).toBe(JSON.stringify(reportInput.tags));
    expect(formData.get("aiConsent")).toBe("false");
    expect(formData.get("isDemoSample")).toBe("true");
    expect(formData.has("ownerId")).toBe(false);
    expect(photo).toBeInstanceOf(File);
    expect(photo.name).toBe("asap-gambut.webp");
  });

  it("maps authentication, photo-size, and server errors to volunteer messages", () => {
    expect(getSyncFailureMessage(401)).toContain("Sesi");
    expect(getSyncFailureMessage(403)).toContain("Sesi");
    expect(getSyncFailureMessage(403, true)).toContain("Sampel demo");
    expect(getSyncFailureMessage(413)).toContain("Ukuran foto");
    expect(getSyncFailureMessage(503)).toContain("gangguan");
  });

  it("reads the backend's created and idempotent report response shapes", () => {
    expect(
      readServerReportId({
        id: serverReportId,
        report: { id: serverReportId },
      }),
    ).toBe(serverReportId);
    expect(readServerReportId({ report: { id: serverReportId } })).toBe(
      serverReportId,
    );
    expect(readServerReportId({ report: null })).toBeNull();
  });
});
