import type { NewFieldReport, QueuedFieldReport } from "./types";

export function createClientReportId(): string {
  if (typeof crypto === "undefined") {
    throw new Error("Secure random numbers are unavailable in this browser.");
  }

  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

export function createQueuedReport(
  report: NewFieldReport,
  ownerId: string,
  clientReportId = createClientReportId(),
  createdAt = new Date().toISOString(),
): QueuedFieldReport {
  if (!ownerId.trim()) {
    throw new Error("Masuk online sekali untuk mengaktifkan laporan offline.");
  }

  return {
    ...report,
    ownerId: ownerId.trim(),
    clientReportId,
    createdAt,
    syncState: "pending",
    syncError: null,
    serverReportId: null,
    aiState: report.aiConsent ? "pending" : "skipped",
  };
}

export function buildReportFormData(report: QueuedFieldReport): FormData {
  const body = new FormData();
  body.set("clientReportId", report.clientReportId);
  body.set("expectedOwnerId", report.ownerId);
  body.set("capturedAt", report.capturedAt);
  body.set("latitude", String(report.latitude));
  body.set("longitude", String(report.longitude));
  body.set(
    "accuracyMeters",
    report.accuracyMeters === null ? "" : String(report.accuracyMeters),
  );
  body.set("fieldNotes", report.fieldNotes);
  body.set("tags", JSON.stringify(report.tags));
  body.set("aiConsent", String(report.aiConsent));
  body.set("isDemoSample", String(report.isDemoSample));
  body.set("photo", report.photo, report.photoName);
  return body;
}

const SERVER_REPORT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function readServerReportId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const topLevelId = Reflect.get(payload, "id");
  if (typeof topLevelId === "string" && SERVER_REPORT_UUID.test(topLevelId)) {
    return topLevelId;
  }

  const report = Reflect.get(payload, "report");
  if (report && typeof report === "object") {
    const reportId = Reflect.get(report, "id");
    return typeof reportId === "string" && SERVER_REPORT_UUID.test(reportId)
      ? reportId
      : null;
  }

  return null;
}

export function getSyncFailureMessage(
  status: number,
  isDemoSample = false,
): string {
  if (status === 403 && isDemoSample) {
    return "Sampel demo hanya dapat dikirim dengan akun relawan demo lokal. Ganti dengan foto kejadian untuk mengirim laporan ini.";
  }

  if (status === 401 || status === 403) {
    return "Sesi perlu diperiksa sebelum laporan dapat dikirim.";
  }

  if (status === 413) {
    return "Ukuran foto melebihi batas server. Pilih foto yang lebih kecil.";
  }

  if (status >= 500) {
    return "Posko sedang mengalami gangguan. Laporan tetap tersimpan di perangkat.";
  }

  return "Laporan belum dapat dikirim. Periksa kembali data lalu coba lagi.";
}
