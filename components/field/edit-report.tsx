"use client";

import { ArrowLeft } from "lucide-react";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { FieldReportForm } from "./field-report-form";
import { saveQueuedReport } from "@/lib/client/offline/report-store";
import type { NewFieldReport } from "@/lib/client/offline/types";
import { useOwnedReport } from "./use-owned-report";

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
    setNotice(
      data.aiConsent
        ? "Perubahan laporan tersimpan di perangkat."
        : "Perubahan tersimpan. Analisis AI dilewati sesuai pilihan Anda.",
    );
    if (isConnected) {
      window.location.assign(
        `/field/report?reportId=${encodeURIComponent(reportId)}`,
      );
    } else {
      window.location.assign("/field/queue");
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
          href={`/field/report?reportId=${encodeURIComponent(reportId)}`}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-peat-green"
        >
          <ArrowLeft aria-hidden="true" size={17} /> Kembali ke laporan
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-5">
      <a
        href={`/field/report?reportId=${encodeURIComponent(reportId)}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
      >
        <ArrowLeft aria-hidden="true" size={17} /> Batal
      </a>
      <p className="mt-3 text-sm text-muted-foreground">
        Perbarui laporan tersimpan
      </p>
      <h1 className="mt-1 mb-5 font-heading text-4xl leading-none font-bold text-peat-forest">
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
