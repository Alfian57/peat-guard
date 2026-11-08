import { authClient } from "@/lib/auth-client";
import {
  buildReportFormData,
  getSyncFailureMessage,
  readServerReportId,
} from "./report-contract";
import {
  isActiveVolunteerOwnerMatch,
  isSessionAuthDenied,
} from "./owner-store";
import { listQueuedReports, saveQueuedReport } from "./report-store";
import type { QueuedFieldReport, SyncSummary } from "./types";
import { API_ROUTES } from "@/lib/routes";

let activeSync: { ownerId: string; promise: Promise<SyncSummary> } | null =
  null;

function isAuthenticationFailure(status: number): boolean {
  return isSessionAuthDenied(status);
}

async function syncReports(
  ownerId: string,
  onReportUpdated?: (report: QueuedFieldReport) => void,
  includeAuthenticationFailures = false,
): Promise<SyncSummary> {
  const summary: SyncSummary = { synced: 0, failed: 0, requiresAuth: 0 };
  const reports = await listQueuedReports(ownerId);
  const candidates = reports.filter(
    (report) =>
      report.syncState !== "synced" &&
      (includeAuthenticationFailures || report.syncState !== "requires-auth"),
  );

  for (const report of candidates) {
    let activeSessionOwnerId: string | null = null;
    let activeSessionRole: unknown = null;
    try {
      const sessionResponse = await authClient.getSession();
      if (!sessionResponse.error) {
        const activeUser = sessionResponse.data?.user;
        activeSessionOwnerId = activeUser?.id ?? null;
        activeSessionRole = activeUser ? Reflect.get(activeUser, "role") : null;
      }
    } catch {
      activeSessionOwnerId = null;
    }

    if (
      !isActiveVolunteerOwnerMatch(
        ownerId,
        activeSessionOwnerId,
        activeSessionRole,
      )
    ) {
      const blockedReport: QueuedFieldReport = {
        ...report,
        syncState: "requires-auth",
        syncError:
          "Sesi aktif bukan akun RELAWAN pemilik laporan. Masuk kembali ke akun relawan pemilik untuk mengirim.",
      };
      await saveQueuedReport(blockedReport, ownerId);
      onReportUpdated?.(blockedReport);
      summary.requiresAuth += 1;
      break;
    }

    const syncingReport: QueuedFieldReport = {
      ...report,
      syncState: "syncing",
      syncError: null,
    };
    await saveQueuedReport(syncingReport, ownerId);
    onReportUpdated?.(syncingReport);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(API_ROUTES.reports.root, {
        method: "POST",
        body: buildReportFormData(syncingReport),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        const demoSampleIsForbidden =
          response.status === 403 && syncingReport.isDemoSample;
        const nextState =
          isAuthenticationFailure(response.status) && !demoSampleIsForbidden
            ? "requires-auth"
            : "failed";
        const failedReport: QueuedFieldReport = {
          ...syncingReport,
          syncState: nextState,
          syncError: getSyncFailureMessage(
            response.status,
            syncingReport.isDemoSample,
          ),
        };
        await saveQueuedReport(failedReport, ownerId);
        onReportUpdated?.(failedReport);
        if (nextState === "requires-auth") {
          summary.requiresAuth += 1;
        } else {
          summary.failed += 1;
        }
        continue;
      }

      const payload: unknown = await response.json().catch(() => null);
      const syncedReport: QueuedFieldReport = {
        ...syncingReport,
        syncState: "synced",
        syncError: null,
        serverReportId: readServerReportId(payload),
        aiState: syncingReport.aiConsent ? "pending" : "skipped",
      };
      await saveQueuedReport(syncedReport, ownerId);
      onReportUpdated?.(syncedReport);
      summary.synced += 1;
    } catch {
      const failedReport: QueuedFieldReport = {
        ...syncingReport,
        syncState: "failed",
        syncError: controller.signal.aborted
          ? "Koneksi terlalu lama. Laporan tetap tersimpan; coba sinkronkan lagi."
          : "Koneksi terputus. Laporan tetap tersimpan; coba sinkronkan lagi.",
      };
      await saveQueuedReport(failedReport, ownerId);
      onReportUpdated?.(failedReport);
      summary.failed += 1;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return summary;
}

export function syncQueuedReports(
  ownerId: string,
  onReportUpdated?: (report: QueuedFieldReport) => void,
  includeAuthenticationFailures = false,
): Promise<SyncSummary> {
  if (!ownerId.trim()) {
    return Promise.reject(new Error("Pemilik laporan belum diverifikasi."));
  }

  if (activeSync) {
    if (activeSync.ownerId === ownerId) return activeSync.promise;
    return activeSync.promise
      .catch(() => ({ synced: 0, failed: 0, requiresAuth: 0 }))
      .then(() =>
        syncQueuedReports(
          ownerId,
          onReportUpdated,
          includeAuthenticationFailures,
        ),
      );
  }

  const promise = syncReports(
    ownerId,
    onReportUpdated,
    includeAuthenticationFailures,
  ).finally(() => {
    if (activeSync?.promise === promise) activeSync = null;
  });
  activeSync = { ownerId, promise };
  return promise;
}
