"use client";

import { ArrowLeft } from "lucide-react";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { FieldReportForm } from "./field-report-form";
import { toast } from "@/components/ui/toast";
import { saveQueuedReport } from "@/lib/client/offline/report-store";
import type { NewFieldReport } from "@/lib/client/offline/types";
import { useOwnedReport } from "./use-owned-report";
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
      report.ownerId !== ownerId ||
      report.syncState === "synced"
    ) {
      throw new Error(
        "Laporan yang sudah terkirim tidak dapat diedit dari perangkat ini.",
      );
    }
    await saveQueuedReport(
      {
        ...report,
        ...data,
        syncState: "pending",
        syncError: null,
        serverReportId: null,
        aiState: data.aiConsent ? "pending" : "skipped",
      },
      ownerId,
    );
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

  if (isLoading)
    return (
      <div
        className="mx-auto max-w-xl px-4 pt-8 text-sm text-muted-foreground"
        role="status"
      >
        Membuka laporan…
      </div>
    );
  if (!report)
    return (
      <div className="mx-auto max-w-xl px-4 pt-8">
        <p className="rounded-xl border border-border bg-white p-4 text-sm">
          {ownerId
            ? "Laporan tidak ditemukan atau tidak dapat diakses oleh akun ini."
            : ownerStatusMessage(ownerStatus)}
        </p>
      </div>
    );
  if (report.syncState === "synced") {
    return (
      <div className="mx-auto max-w-xl px-4 pt-8">
        <p className="rounded-xl border border-border bg-white p-4 text-sm">
          Laporan sudah diterima posko dan tidak dapat diedit di perangkat ini.
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
    <div className="mx-auto w-full max-w-xl px-4 pt-4 lg:max-w-4xl lg:px-0 lg:pt-0">
      <a
        href={`${APP_ROUTES.field.report}?reportId=${encodeURIComponent(reportId)}`}
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline focus-visible:outline-2 focus-visible:outline-peat-green"
      >
        <ArrowLeft aria-hidden="true" size={17} /> Kembali ke detail laporan
      </a>
      <h1 className="mb-5 font-heading text-4xl leading-none font-bold text-peat-forest">
        Edit laporan
      </h1>
      <FieldReportForm
        initialReport={report}
        canSave={Boolean(ownerId) && report.ownerId === ownerId}
        canUseDemoSamples={canUseDemoSamples}
        submitLabel="Simpan perubahan"
        onSave={updateReport}
      />
    </div>
  );
}
