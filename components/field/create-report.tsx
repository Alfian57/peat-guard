"use client";

import { ArrowLeft } from "lucide-react";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { FieldReportForm } from "./field-report-form";
import { toast } from "@/components/ui/toast";
import { createQueuedReport } from "@/lib/client/offline/report-contract";
import { saveQueuedReport } from "@/lib/client/offline/report-store";
import { APP_ROUTES } from "@/lib/routes";

/* eslint-disable @next/next/no-location-assign-relative-destination -- Full navigations let the service worker serve cached field shells offline. */

export function CreateReport() {
  const {
    canUseDemoSamples,
    isConnected,
    ownerId,
    ownerStatus,
    refreshQueue,
    setNotice,
  } = useFieldShell();
  const canSave =
    ownerId !== null &&
    (ownerStatus === "authenticated" || ownerStatus === "offline-known");

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
    <div className="mx-auto w-full max-w-xl px-4 pt-4 lg:max-w-4xl lg:px-0 lg:pt-0">
      <a
        href={APP_ROUTES.field.home}
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline focus-visible:outline-2 focus-visible:outline-peat-green"
      >
        <ArrowLeft aria-hidden="true" size={17} /> Kembali ke beranda
      </a>
      <h1 className="font-heading text-4xl leading-none font-bold text-peat-forest">
        Lapor temuan
      </h1>
      <p className="mt-2 mb-5 text-sm leading-5 text-muted-foreground">
        Simpan bukti, lokasi, dan catatan. Isian tersimpan di perangkat meski
        jaringan terputus.
      </p>
      <FieldReportForm
        canSave={canSave}
        canUseDemoSamples={canUseDemoSamples}
        saveBlockedMessage={ownerStatusMessage(ownerStatus)}
        submitLabel="Simpan laporan"
        onSave={saveReport}
      />
    </div>
  );
}
