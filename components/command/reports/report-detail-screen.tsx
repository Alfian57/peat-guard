"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { CommandError } from "@/components/command/command-feedback";
import { ReportDetailSkeleton } from "@/components/command/reports/report-detail-skeleton";
import { CommandPageHeading } from "@/components/command/command-page-heading";
import {
  isZonesResponse,
  requestCommandJson,
} from "@/components/command/command-api";
import {
  isReportDetailResponse,
  isReportStatusResponse,
  type ReportDetail,
  type ReportStatus,
} from "@/components/command/reports/report-contracts";
import { ReportAiAnalysis } from "@/components/command/reports/report-ai-analysis";
import { ReportEvidence } from "@/components/command/reports/report-evidence";
import { ReportLocationDetails } from "@/components/command/reports/report-location-details";
import { ReportStatusHistory } from "@/components/command/reports/report-status-history";
import { ReportStatusBadge } from "@/components/command/reports/report-status-badge";
import { ReportStatusDialog } from "@/components/command/reports/report-status-dialog";
import { toast } from "@/components/ui/toast";
import {
  COMMAND_API_ROUTES,
  COMMAND_ROUTES,
  reportApiRoute,
} from "@/components/command/routes";
import type { CommandZone } from "@/lib/server/zones/data";

type LoadState = "loading" | "ready" | "error";

export function ReportDetailScreen({ reportId }: { reportId: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const [retryKey, setRetryKey] = useState(0);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [zones, setZones] = useState<CommandZone[]>([]);
  const [loadError, setLoadError] = useState("");
  const [photoAvailable, setPhotoAvailable] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const reportRequest = requestCommandJson(reportApiRoute(reportId), {
      cache: "no-store",
      signal: controller.signal,
    });
    const zonesRequest = requestCommandJson(COMMAND_API_ROUTES.zones, {
      cache: "no-store",
      signal: controller.signal,
    }).then((payload) => {
      if (!isZonesResponse(payload)) {
        throw new Error("Daftar zona dari server tidak sesuai format.");
      }
      return payload.zones;
    });

    Promise.all([reportRequest, zonesRequest])
      .then(([payload, availableZones]) => {
        if (!isReportDetailResponse(payload)) {
          throw new Error("Detail laporan dari server tidak sesuai format.");
        }
        setReport(payload.report);
        setZones(availableZones);
        setPhotoAvailable(true);
        setState("ready");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          cause instanceof Error
            ? cause.message
            : "Detail laporan belum dapat dimuat.",
        );
        setState("error");
      });

    return () => controller.abort();
  }, [reportId, retryKey]);

  async function saveStatus(nextStatus: ReportStatus, note: string) {
    if (!report) return;
    setIsSaving(true);
    setStatusError("");

    const trimmedNote = note.trim();
    try {
      const payload = await requestCommandJson(reportApiRoute(report.id), {
        method: "PATCH",
        body: JSON.stringify({
          expectedStatus: report.handlingStatus,
          nextStatus,
          ...(trimmedNote ? { note: trimmedNote } : {}),
        }),
      });

      if (
        !isReportStatusResponse(payload) ||
        payload.id !== report.id ||
        payload.status !== nextStatus
      ) {
        throw new Error("Pembaruan status dari server tidak sesuai format.");
      }

      setReport((current) =>
        current ? { ...current, handlingStatus: payload.status } : current,
      );
      setStatusDialogOpen(false);

      try {
        const refreshed = await requestCommandJson(reportApiRoute(report.id), {
          cache: "no-store",
        });
        if (isReportDetailResponse(refreshed)) {
          setReport(refreshed.report);
        } else {
          throw new Error("Detail laporan dari server tidak sesuai format.");
        }
      } catch {
        toast.warning(
          "Status laporan tersimpan",
          "Riwayat belum dapat dimuat ulang. Muat ulang halaman untuk melihat pembaruan terbaru.",
        );
        return;
      }
      toast.success(
        "Status laporan diperbarui",
        "Status penanganan insiden berhasil disimpan.",
      );
    } catch (cause) {
      if (
        typeof cause === "object" &&
        cause !== null &&
        "status" in cause &&
        cause.status === 409
      ) {
        setStatusError(
          "Status laporan telah berubah. Data terbaru sedang dimuat; pilih status lalu simpan kembali.",
        );
        try {
          const refreshed = await requestCommandJson(
            reportApiRoute(report.id),
            {
              cache: "no-store",
            },
          );
          if (isReportDetailResponse(refreshed)) {
            setReport(refreshed.report);
          }
        } catch {
          setStatusError(
            "Status laporan telah berubah. Tutup dialog dan muat ulang data sebelum mencoba lagi.",
          );
        }
      } else {
        setStatusError(
          cause instanceof Error
            ? cause.message
            : "Status laporan belum dapat diperbarui.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  const zoneName = report?.zoneId
    ? (zones.find((zone) => zone.id === report.zoneId)?.name ??
      "Zona belum tersedia")
    : null;

  if (state === "loading") {
    return <ReportDetailSkeleton />;
  }

  if (state === "error" || !report) {
    return (
      <div>
        <Link
          className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline"
          href={COMMAND_ROUTES.reports}
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Kembali ke daftar insiden
        </Link>
        <CommandError
          message={loadError || "Detail laporan tidak tersedia."}
          onRetry={() => {
            setState("loading");
            setRetryKey((current) => current + 1);
          }}
        />
      </div>
    );
  }

  const displayId = "PG-" + report.id.slice(0, 8).toUpperCase();

  return (
    <div>
      <Link
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline"
        href={COMMAND_ROUTES.reports}
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Kembali ke daftar insiden
      </Link>

      <CommandPageHeading
        action={
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-peat-forest px-4 text-xs font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
            onClick={() => {
              setStatusError("");
              setStatusDialogOpen(true);
            }}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={14} />
            Update status
          </button>
        }
        description="Tinjau bukti, lokasi, analisis, dan riwayat penanganan laporan lapangan."
        title={`Insiden ${displayId}`}
      />

      <div className="-mt-2 mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs text-muted-foreground">Status penanganan</span>
        <ReportStatusBadge status={report.handlingStatus} />
        {report.isDemoSample ? (
          <span className="rounded-full bg-peat-sun/25 px-3 py-1 text-xs font-semibold text-peat-forest">
            Sampel demo
          </span>
        ) : null}
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ReportEvidence
          onPhotoError={() => setPhotoAvailable(false)}
          photoAvailable={photoAvailable}
          report={report}
        />
        <div className="flex min-w-0 flex-col gap-5">
          <ReportAiAnalysis report={report} />
          <ReportLocationDetails report={report} zoneName={zoneName} />
          <ReportStatusHistory
            className="xl:flex-1"
            events={report.statusEvents}
          />
        </div>
      </div>

      {statusDialogOpen ? (
        <ReportStatusDialog
          error={statusError}
          isSaving={isSaving}
          key={report.handlingStatus}
          onCancel={() => setStatusDialogOpen(false)}
          onSave={(nextStatus, note) => void saveStatus(nextStatus, note)}
          report={report}
        />
      ) : null}
    </div>
  );
}
