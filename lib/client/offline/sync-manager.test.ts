import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { registerFieldReportDatabase } from "@/test/field-indexed-db";
import { createQueuedReport } from "./report-contract";
import {
  claimQueuedReport,
  editQueuedReport,
  finishQueuedReport,
  getQueuedReport,
  removeQueuedReport,
  saveQueuedReport,
} from "./report-store";
import { syncQueuedReports } from "./sync-manager";

const ownerId = "70000000-0000-4000-8000-000000000001";
const serverId = "70000000-0000-4000-8000-000000000002";
const content = {
  capturedAt: "2026-11-18T01:00:00.000Z",
  latitude: -2,
  longitude: 114,
  accuracyMeters: null,
  fieldNotes: "Draf awal",
  tags: [],
  aiConsent: false,
  isDemoSample: false,
  photo: new Blob(["photo"], { type: "image/webp" }),
  photoName: "photo.webp",
  photoType: "image/webp",
};

const originalFetch = globalThis.fetch;
let restoreDatabase: () => void;
beforeEach(() => {
  restoreDatabase = registerFieldReportDatabase();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreDatabase();
});

test("claims the latest version and skips a previously deleted draft", async () => {
  const original = createQueuedReport(content, ownerId);
  await saveQueuedReport(original, ownerId);
  expect(
    await editQueuedReport(original, ownerId, {
      ...content,
      fieldNotes: "Versi terbaru",
    }),
  ).toBe(true);
  expect(await editQueuedReport(original, ownerId, content)).toBe(false);

  const claim = await claimQueuedReport(original.clientReportId, ownerId);
  expect(claim?.fieldNotes).toBe("Versi terbaru");
  expect(await removeQueuedReport(original.clientReportId, ownerId)).toBe(
    false,
  );
  expect(await editQueuedReport(original, ownerId, content)).toBe(false);
  expect(await claimQueuedReport(original.clientReportId, ownerId)).toBeNull();

  const deleted = createQueuedReport(content, ownerId);
  await saveQueuedReport(deleted, ownerId);
  expect(await removeQueuedReport(deleted.clientReportId, ownerId)).toBe(true);
  expect(await claimQueuedReport(deleted.clientReportId, ownerId)).toBeNull();
});

test("preserves the payload and ID until a retry confirms delivery", async () => {
  const report = createQueuedReport(content, ownerId);
  await saveQueuedReport(report, ownerId);
  const accepted = Promise.withResolvers<void>();
  let attempts = 0;
  globalThis.fetch = mock(
    async (_request: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.body).toBeInstanceOf(FormData);
      const data = init?.body as FormData;
      expect(data.get("expectedOwnerId")).toBe(ownerId);
      expect(data.get("clientReportId")).toBe(report.clientReportId);
      expect(data.get("fieldNotes")).toBe(content.fieldNotes);
      attempts += 1;
      if (attempts === 1) throw new TypeError("interrupted connection");
      accepted.resolve();
      return Response.json({ id: serverId }, { status: 200 });
    },
  ) as typeof fetch;

  expect(await syncQueuedReports(ownerId)).toMatchObject({
    failed: 1,
    retryable: true,
  });
  expect(
    await editQueuedReport(report, ownerId, { ...content, fieldNotes: "Ubah" }),
  ).toBe(false);
  expect(await removeQueuedReport(report.clientReportId, ownerId)).toBe(false);
  expect(await syncQueuedReports(ownerId)).toMatchObject({ synced: 1 });
  await accepted.promise;
  expect(await getQueuedReport(report.clientReportId, ownerId)).toMatchObject({
    syncState: "synced",
    serverReportId: serverId,
  });
});

test("a stale completion cannot overwrite another sync claim", async () => {
  const draft = createQueuedReport(content, ownerId);
  await saveQueuedReport(draft, ownerId);
  const first = await claimQueuedReport(draft.clientReportId, ownerId);
  expect(first).toBeTruthy();
  if (!first) throw new Error("Missing claim");
  expect(
    await finishQueuedReport(first, {
      syncState: "failed",
      syncError: null,
      uploadUncertain: true,
    }),
  ).toBeTruthy();
  const second = await claimQueuedReport(draft.clientReportId, ownerId);
  expect(second?.syncLease?.token).not.toBe(first.syncLease?.token);
  expect(
    await finishQueuedReport(first, {
      syncState: "synced",
      syncError: null,
      serverReportId: serverId,
      uploadUncertain: false,
    }),
  ).toBeNull();
});

test("recovers a committed upload immediately after reload without reuploading its photo", async () => {
  const report = createQueuedReport(content, ownerId);
  await saveQueuedReport(report, ownerId);
  expect(
    await claimQueuedReport(report.clientReportId, ownerId),
  ).not.toBeNull();
  const fetchReceipt = mock(
    async (request: RequestInfo | URL, options?: RequestInit) => {
      expect(request).toBe(`/api/reports/receipt/${report.clientReportId}`);
      expect(options?.body).toBeUndefined();
      return Response.json({ id: serverId });
    },
  );
  globalThis.fetch = fetchReceipt as typeof fetch;

  expect((await syncQueuedReports(ownerId)).synced).toBe(1);
  expect(fetchReceipt).toHaveBeenCalledTimes(1);
  expect(await getQueuedReport(report.clientReportId, ownerId)).toMatchObject({
    syncState: "synced",
    syncLease: null,
    serverReportId: serverId,
  });
});
