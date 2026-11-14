"use client";

import { ArrowLeft } from "lucide-react";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { FieldReportForm } from "./field-report-form";
import { FieldReportEditorSkeleton } from "./field-report-editor-skeleton";
import { toast } from "@/components/ui/toast";
import {
  editQueuedReport,
  isRemovableLocalDraft,
} from "@/lib/client/offline/report-store";
import type { NewFieldReport } from "@/lib/client/offline/types";
import { useOwnedReport } from "./use-owned-report";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { APP_ROUTES } from "@/lib/routes";

/* eslint-disable @next/next/no-location-assign-relative-destination -- Full navigations let the service worker serve cached field shells offline. */

export function EditReport({ reportId }: { reportId: string }) {
  const { canUseDemoSamples, isConnected, ownerId, refreshQueue, setNotice } =
    useFieldShell();
  const { ownerStatus, report, isLoading } = useOwnedReport(reportId);

  async function updateReport(data: NewFieldReport) {
    if (
      !report ||
      !ownerId ||
      !(await editQueuedReport(report, ownerId, data))
    ) {
      throw new Error(
        "Draf sudah berubah atau sedang dikirim. Buka kembali laporan untuk melihat status terbaru.",
      );
    }
    await refreshQueue();
    const noticeText = data.aiConsent
      ? "Perubahan laporan tersimpan di perangkat."
      : "Perubahan tersimpan. Analisis AI dilewati sesuai pilihan Anda.";
    setNotice(noticeText);
    toast.flash("Laporan diperbarui", noticeText);
    if (isConnected) {
      window.location.assign(
        `${APP_ROUTES.field.report}?reportId=${encodeURIComponent(reportId)}`,
      );
    } else {
      window.location.assign(APP_ROUTES.field.queue);
    }
  }

  if (ownerStatus === "loading" || isLoading) {
    return <FieldReportEditorSkeleton />;
  }
  if (!report)
    return (
      <div className="w-full min-w-0">
        <p className="rounded-xl border border-peat-forest/10 bg-white p-4 text-sm">
          {ownerId
            ? "Laporan tidak ditemukan atau tidak dapat diakses oleh akun ini."
            : ownerStatusMessage(ownerStatus)}
        </p>
      </div>
    );
  if (!isRemovableLocalDraft(report)) {
    return (
      <div className="w-full min-w-0">
        <p className="rounded-xl border border-peat-forest/10 bg-white p-4 text-sm">
          {report.syncState === "synced"
            ? "Laporan sudah diterima posko dan tidak dapat diedit di perangkat ini."
            : "Tunggu status pengiriman terkonfirmasi sebelum mengedit laporan."}
        </p>
        <a
          href={`${APP_ROUTES.field.report}?reportId=${encodeURIComponent(reportId)}`}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-peat-forest hover:underline"
        >
          <ArrowLeft aria-hidden="true" size={17} /> Kembali ke detail laporan
        </a>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <a
        href={`${APP_ROUTES.field.report}?reportId=${encodeURIComponent(reportId)}`}
        className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline focus-visible:outline-2 focus-visible:outline-peat-green"
      >
        <ArrowLeft aria-hidden="true" size={17} /> Kembali ke detail laporan
      </a>
      <WorkspacePageHeading
        compact
        className="mb-4"
        title="Edit laporan"
        description="Perbarui bukti dan catatan sebelum laporan dikirim ke posko."
      />
      <FieldReportForm
        isConnected={isConnected}
        initialReport={report}
        canSave={Boolean(ownerId) && report.ownerId === ownerId}
        canUseDemoSamples={canUseDemoSamples}
        submitLabel="Simpan perubahan"
        onSave={updateReport}
      />
    </div>
  );
}
