import { afterEach, expect, mock, test } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";

let syncRevision = 0;
const ownerId = "70000000-0000-4000-8000-000000000001";
const refreshQueue = async () => [];
const setNotice = () => undefined;
const originalFetch = globalThis.fetch;

mock.module("@/components/field/field-app-shell", () => ({
  useFieldShell: () => ({
    isConnected: true,
    ownerId,
    ownerStatus: "authenticated",
    queueCount: 0,
    syncRevision,
    refreshQueue,
    setNotice,
  }),
}));

const { useFieldReportHistory } = await import("./use-field-report-history");

afterEach(() => {
  syncRevision = 0;
  globalThis.fetch = originalFetch;
});

test("revalidates server history after an automatic sync completes", async () => {
  const second = Promise.withResolvers<Response>();
  let reads = 0;
  globalThis.fetch = mock(async () => {
    reads += 1;
    return reads === 1
      ? Response.json({ reports: [], total: 0, page: 1, pageSize: 25 })
      : second.promise;
  }) as typeof fetch;
  const { result, rerender } = renderHook(() => useFieldReportHistory());

  await waitFor(() => expect(result.current.serverStatus).toBe("loaded"));
  syncRevision += 1;
  rerender();
  expect(result.current.serverStatus).toBe("loading");
  await waitFor(() => expect(reads).toBe(2));
  await act(async () =>
    second.resolve(
      Response.json({ reports: [], total: 1, page: 1, pageSize: 25 }),
    ),
  );
  expect(result.current.serverStatus).toBe("loaded");
  expect(result.current.serverTotal).toBe(1);
});
