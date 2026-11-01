import { describe, expect, test } from "bun:test";

import {
  MAX_REPORT_STATUS_REQUEST_BYTES,
  parseReportStatusUpdate,
  readReportStatusUpdate,
} from "@/lib/server/reports/status-input";
import { ReportInputError } from "@/lib/server/reports/input";

describe("report status updates", () => {
  test("parses expected and next states and trims the optional note", () => {
    expect(
      parseReportStatusUpdate({
        expectedStatus: "MENUNGGU_TINDAKAN",
        nextStatus: "DALAM_PENANGANAN",
        note: "  Tim posko mengirim regu.  ",
      }),
    ).toEqual({
      expectedStatus: "MENUNGGU_TINDAKAN",
      nextStatus: "DALAM_PENANGANAN",
      note: "Tim posko mengirim regu.",
    });
  });

  test("rejects stale-shape, invalid statuses, no-op updates, and long notes", () => {
    expect(() => parseReportStatusUpdate(null)).toThrow(ReportInputError);
    expect(() =>
      parseReportStatusUpdate({
        expectedStatus: "WAITING",
        nextStatus: "DONE",
      }),
    ).toThrow(ReportInputError);
    expect(() =>
      parseReportStatusUpdate({
        expectedStatus: "SELESAI",
        nextStatus: "SELESAI",
      }),
    ).toThrow(ReportInputError);
    expect(() =>
      parseReportStatusUpdate({
        expectedStatus: "MENUNGGU_TINDAKAN",
        nextStatus: "DALAM_PENANGANAN",
        note: "x".repeat(501),
      }),
    ).toThrow(ReportInputError);
  });

  test("reads only bounded JSON status bodies before parsing", async () => {
    const request = new Request("http://localhost/api/reports/id", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        expectedStatus: "MENUNGGU_TINDAKAN",
        nextStatus: "DALAM_PENANGANAN",
      }),
    });
    await expect(readReportStatusUpdate(request)).resolves.toMatchObject({
      expectedStatus: "MENUNGGU_TINDAKAN",
      nextStatus: "DALAM_PENANGANAN",
    });

    const oversizedBody = new Blob([
      new Uint8Array(MAX_REPORT_STATUS_REQUEST_BYTES + 1),
    ]);
    const withoutLength = new Request("http://localhost/api/reports/id", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: oversizedBody,
    });
    await expect(readReportStatusUpdate(withoutLength)).rejects.toMatchObject({
      status: 413,
    });

    const understatedLength = new Request("http://localhost/api/reports/id", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "content-length": "1",
      },
      body: oversizedBody,
    });
    await expect(
      readReportStatusUpdate(understatedLength),
    ).rejects.toMatchObject({ status: 413 });
  });
});
