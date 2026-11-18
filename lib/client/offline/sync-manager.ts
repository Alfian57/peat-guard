import { API_ROUTES } from "@/lib/routes";
import {
  buildReportFormData,
  getSyncFailureMessage,
  readServerReportId,
} from "./report-contract";
import { isSessionAuthDenied } from "./owner-store";
import {
  claimQueuedReport,
  finishQueuedReport,
  listQueuedReports,
} from "./report-store";
import type { QueuedFieldReport, SyncSummary } from "./types";

type SyncOptions = {
  onReportUpdated?: (report: QueuedFieldReport) => void;
  signal?: AbortSignal;
};

let activeSync: {
  ownerId: string;
  signal?: AbortSignal;
  promise: Promise<SyncSummary>;
} | null = null;

function reportErrorCode(payload: unknown): unknown {
  return typeof payload === "object" && payload !== null && "code" in payload
    ? payload.code
    : undefined;
}

async function syncReports(
  ownerId: string,
  { onReportUpdated, signal }: SyncOptions,
): Promise<SyncSummary> {
  const summary: SyncSummary = { synced: 0, failed: 0, requiresAuth: 0 };
  const reports = await listQueuedReports(ownerId);

  for (const report of reports) {
    if (signal?.aborted) break;
    if (report.syncState === "synced") continue;

    const claim = await claimQueuedReport(report.clientReportId, ownerId);
    if (!claim) {
      if (
        report.syncState === "syncing" &&
        report.syncLease &&
        !signal?.aborted
      ) {
        const recovered = await recoverReceipt(report, signal);
        if (recovered) {
          summary.synced += 1;
          onReportUpdated?.(recovered);
          continue;
        }
      }
      summary.retryable = true;
      continue;
    }
    onReportUpdated?.(claim);
    const timeout = AbortSignal.timeout(45_000);
    const uploadSignal = signal ? AbortSignal.any([timeout, signal]) : timeout;
    let serverFailure: { status: number; code: unknown } | undefined;
    let serverReportId: string | null = null;

    try {
      const response = await fetch(API_ROUTES.reports.root, {
        method: "POST",
        body: buildReportFormData(claim),
        signal: uploadSignal,
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (response.ok) serverReportId = readServerReportId(payload);
      else
        serverFailure = {
          status: response.status,
          code: reportErrorCode(payload),
        };
    } catch {
      // A lost response may follow a successful commit. Retry the same draft.
    }

    const demoSampleDenied = serverFailure?.code === "demo_sample_forbidden";
    const requiresAuth =
      serverFailure !== undefined &&
      isSessionAuthDenied(serverFailure.status) &&
      !demoSampleDenied;
    const retryable =
      !serverFailure ||
      serverFailure.status >= 500 ||
      serverFailure.status === 429;
    const updated = await finishQueuedReport(
      claim,
      serverReportId
        ? {
            syncState: "synced",
            syncError: null,
            uploadUncertain: false,
            serverReportId,
            aiState: claim.aiConsent ? "pending" : "skipped",
          }
        : {
            syncState: requiresAuth ? "requires-auth" : "failed",
            syncError: serverFailure
              ? getSyncFailureMessage(serverFailure.status, demoSampleDenied)
              : "Pengiriman belum terkonfirmasi. Laporan tetap tersimpan dan dapat disinkronkan kembali.",
            uploadUncertain: Boolean(
              claim.uploadUncertain ||
              !serverFailure ||
              serverFailure.status >= 500,
            ),
          },
    );
    if (!updated) continue;
    onReportUpdated?.(updated);
    if (serverReportId) summary.synced += 1;
    else if (requiresAuth) {
      summary.requiresAuth += 1;
      break;
    } else {
      summary.failed += 1;
      if (retryable) summary.retryable = true;
    }
  }
  return summary;
}

async function recoverReceipt(report: QueuedFieldReport, signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(5_000);
  try {
    const response = await fetch(
      API_ROUTES.reports.receipt(report.clientReportId),
      {
        cache: "no-store",
        signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
      },
    );
    if (!response.ok || signal?.aborted) return null;
    const serverReportId = readServerReportId(await response.json());
    if (!serverReportId || signal?.aborted) return null;
    return finishQueuedReport(report, {
      syncState: "synced",
      syncError: null,
      uploadUncertain: false,
      serverReportId,
      aiState: report.aiConsent ? "pending" : "skipped",
    });
  } catch {
    return null;
  }
}

export function syncQueuedReports(
  ownerId: string,
  options: SyncOptions = {},
): Promise<SyncSummary> {
  if (!ownerId.trim()) {
    return Promise.reject(new Error("Pemilik laporan belum diverifikasi."));
  }
  if (activeSync) {
    if (activeSync.ownerId === ownerId && activeSync.signal === options.signal)
      return activeSync.promise;
    return activeSync.promise
      .catch(() => undefined)
      .then(() => syncQueuedReports(ownerId, options));
  }
  const promise = syncReports(ownerId, options).finally(() => {
    if (activeSync?.promise === promise) activeSync = null;
  });
  activeSync = { ownerId, signal: options.signal, promise };
  return promise;
}
