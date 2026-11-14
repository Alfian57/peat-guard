"use client";

import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { FieldReportForm } from "./field-report-form";
import { FieldReportFormSkeleton } from "./field-report-form-skeleton";
import { toast } from "@/components/ui/toast";
import { createQueuedReport } from "@/lib/client/offline/report-contract";
import { saveQueuedReport } from "@/lib/client/offline/report-store";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { APP_ROUTES } from "@/lib/routes";

/* eslint-disable @next/next/no-location-assign-relative-destination -- Full navigations let the service worker serve cached field shells offline. */

export function CreateReport() {
  const { isConnected, ownerId, ownerStatus, refreshQueue, setNotice } =
    useFieldShell();
  const canSave =
    ownerId !== null &&
    (ownerStatus === "authenticated" || ownerStatus === "offline-known");
  const isCheckingOwner = ownerStatus === "loading";

  async function saveReport(data: Parameters<typeof createQueuedReport>[0]) {
    if (!canSave || !ownerId) {
      throw new Error(ownerStatusMessage(ownerStatus));
    }
    const report = createQueuedReport(data, ownerId);
    await saveQueuedReport(report, ownerId);
    await refreshQueue();
    const noticeText = data.aiConsent
      ? "Laporan tersimpan di perangkat. Analisis AI menunggu pemrosesan posko."
      : "Laporan tersimpan. Analisis AI dilewati sesuai pilihan Anda.";
    setNotice(noticeText);
    toast.flash("Laporan berhasil dibuat", noticeText);
    if (isConnected) {
      window.location.assign(
        `${APP_ROUTES.field.report}?reportId=${encodeURIComponent(report.clientReportId)}`,
      );
    } else {
      window.location.assign(APP_ROUTES.field.queue);
    }
  }

  return (
    <div className="w-full min-w-0">
      <WorkspacePageHeading
        compact
        className="mb-4"
        title="Lapor temuan"
        description="Simpan foto, lokasi, dan catatan patroli. Laporan tetap tersimpan di perangkat saat offline."
      />
      {isCheckingOwner ? <FieldReportFormSkeleton /> : null}
      <div hidden={isCheckingOwner}>
        <FieldReportForm
          isConnected={isConnected && !isCheckingOwner}
          canSave={canSave}
          saveBlockedMessage={ownerStatusMessage(ownerStatus)}
          submitLabel="Simpan laporan"
          onSave={saveReport}
        />
      </div>
    </div>
  );
}
