import { describe, expect, test } from "bun:test";

import {
  MAX_REPORT_REQUEST_BYTES,
  parseClientReportId,
  parseReportFormData,
  readReportFormData,
  ReportInputError,
} from "@/lib/server/reports/input";

const clientReportId = "f42ab70f-4282-4f95-8fd6-e90fb133fdaa";
const validPhoto = new File(["webp"], "field.webp", { type: "image/webp" });

function reportFormData(): FormData {
  const formData = new FormData();
  formData.set("clientReportId", clientReportId);
  formData.set("capturedAt", "2026-11-15T10:30:00.000Z");
  formData.set("latitude", "-2.001");
  formData.set("longitude", "113.904");
  formData.set("accuracyMeters", "");
  formData.set("fieldNotes", "Asap tipis terlihat di kejauhan.");
  formData.set("tags", JSON.stringify(["Asap", "Kanal"]));
  formData.set("aiConsent", "false");
  formData.set("isDemoSample", "false");
  formData.set("photo", validPhoto, validPhoto.name);
  return formData;
}

describe("field report multipart input", () => {
  test("parses the client PWA field contract and keeps blank GPS accuracy null", () => {
    const input = parseReportFormData(reportFormData());

    expect(input.clientReportId).toBe(clientReportId);
    expect(input.capturedAt.toISOString()).toBe("2026-11-15T10:30:00.000Z");
    expect(input.latitude).toBe(-2.001);
    expect(input.longitude).toBe(113.904);
    expect(input.accuracyMeters).toBeNull();
    expect(input.tags).toEqual(["Asap", "Kanal"]);
    expect(input.aiConsent).toBe(false);
    expect(input.isDemoSample).toBe(false);
    expect(input.photo.name).toBe("field.webp");
  });

  test("rejects invalid identifiers, timestamps, coordinates, booleans, and tags", () => {
    const invalidId = reportFormData();
    invalidId.set("clientReportId", "not-a-uuid");
    expect(() => parseClientReportId(invalidId)).toThrow(ReportInputError);

    const invalidTimestamp = reportFormData();
    invalidTimestamp.set("capturedAt", "yesterday");
    expect(() => parseReportFormData(invalidTimestamp)).toThrow(
      ReportInputError,
    );

    const invalidCoordinates = reportFormData();
    invalidCoordinates.set("latitude", "91");
    expect(() => parseReportFormData(invalidCoordinates)).toThrow(
      ReportInputError,
    );

    const invalidBoolean = reportFormData();
    invalidBoolean.set("aiConsent", "yes");
    expect(() => parseReportFormData(invalidBoolean)).toThrow(ReportInputError);

    const invalidTags = reportFormData();
    invalidTags.set("tags", JSON.stringify(["Asap", 5]));
    expect(() => parseReportFormData(invalidTags)).toThrow(ReportInputError);
  });

  test("reads a bounded multipart stream before parsing fields", async () => {
    const request = new Request("http://localhost/api/reports", {
      method: "POST",
      body: reportFormData(),
    });

    const parsed = await readReportFormData(request);
    expect(parseReportFormData(parsed).clientReportId).toBe(clientReportId);
  });

  test("rejects oversized bodies with absent or understated Content-Length", async () => {
    const oversizedBody = new Blob([
      new Uint8Array(MAX_REPORT_REQUEST_BYTES + 1),
    ]);

    const withoutLength = new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=offline" },
      body: oversizedBody,
    });
    await expect(readReportFormData(withoutLength)).rejects.toMatchObject({
      status: 413,
    });

    const understatedLength = new Request("http://localhost/api/reports", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=offline",
        "content-length": "1",
      },
      body: oversizedBody,
    });
    await expect(readReportFormData(understatedLength)).rejects.toBeInstanceOf(
      ReportInputError,
    );
  });
});
