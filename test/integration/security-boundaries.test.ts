import { describe, expect, test } from "bun:test";
import { isReportUuid } from "@/lib/server/reports/read";
import {
  MAX_REPORT_PHOTO_BYTES,
  normalizeReportPhoto,
  ReportPhotoError,
} from "@/lib/server/uploads/private-photo";
import {
  reportActorFromSession,
  reportReadScope,
  type ReportActor,
} from "@/lib/server/reports/access";

describe("Security Boundaries & Multi-Tenant Data Protection", () => {
  describe("Path Traversal & UUID Validation", () => {
    test("rejects path traversal sequences in report and resource IDs", () => {
      expect(isReportUuid("../../etc/passwd")).toBe(false);
      expect(isReportUuid("../../../app/.env")).toBe(false);
      expect(isReportUuid("..\\windows\\system32\\cmd.exe")).toBe(false);
      expect(isReportUuid("12345")).toBe(false);
      expect(isReportUuid("")).toBe(false);
    });

    test("accepts valid RFC 4122 v4 UUIDs", () => {
      expect(isReportUuid("e1c8418c-c692-4148-8dfa-8a19242d501b")).toBe(true);
      expect(isReportUuid("a0000000-0000-4000-8000-000000000001")).toBe(true);
    });
  });

  describe("File Upload Boundary & DoS Protection", () => {
    test("rejects upload files exceeding maximum 8MB limit with 413 Payload Too Large", async () => {
      const oversizedBytes = new Uint8Array(MAX_REPORT_PHOTO_BYTES + 1024);
      const oversizedFile = new File(
        [oversizedBytes],
        "oversized-exploit.jpg",
        {
          type: "image/jpeg",
        },
      );

      try {
        await normalizeReportPhoto(oversizedFile);
        expect().fail(
          "Expected normalizeReportPhoto to throw for oversized file",
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ReportPhotoError);
        expect((error as ReportPhotoError).status).toBe(413);
      }
    });

    test("rejects empty files or files with non-image payloads", async () => {
      const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
      await expect(normalizeReportPhoto(emptyFile)).rejects.toThrow();

      const maliciousScript = new File(
        [Buffer.from("<script>alert('xss')</script>")],
        "exploit.jpg",
        { type: "image/jpeg" },
      );
      await expect(normalizeReportPhoto(maliciousScript)).rejects.toThrow();
    });
  });

  describe("Multi-Tenant Read Scoping & Role Isolation", () => {
    test("restricts volunteer report read scope strictly to their own user ID", () => {
      const volunteerActor: ReportActor = reportActorFromSession({
        id: "volunteer-uuid-1",
        email: "volunteer@example.com",
        name: "Volunteer User",
        role: "RELAWAN",
      });

      const scope = reportReadScope(volunteerActor);
      expect(scope).toEqual({ reporterId: "volunteer-uuid-1" });
    });

    test("grants unrestricted read scope to POSKO and VERIFIKATOR actors", () => {
      const poskoActor: ReportActor = reportActorFromSession({
        id: "posko-uuid-2",
        email: "posko@example.com",
        name: "Posko Coordinator",
        role: "POSKO",
      });
      expect(reportReadScope(poskoActor)).toEqual({});

      const verifikatorActor: ReportActor = reportActorFromSession({
        id: "verifikator-uuid-3",
        email: "verifikator@example.com",
        name: "MRV Verifier",
        role: "VERIFIKATOR",
      });
      expect(reportReadScope(verifikatorActor)).toEqual({});
    });
  });
});
