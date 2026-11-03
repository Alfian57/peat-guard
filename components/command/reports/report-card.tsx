import Link from "next/link";
import { ArrowUpRight, Camera, MapPinned } from "lucide-react";

import {
  AiStateLabel,
  ReportCategoryLabel,
  ReportStatusBadge,
  ReportUrgencyBadge,
} from "@/components/command/reports/report-status-badge";
import { reportDetailRoute } from "@/components/command/routes";
import type { ReportListItem } from "@/components/command/reports/report-contracts";

export function ReportCard({
  report,
  zoneName,
}: {
  report: ReportListItem;
  zoneName: string | null;
}) {
  const displayId = "PG-" + report.id.slice(0, 8).toUpperCase();
  return (
    <li className="rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-label={"ID laporan " + report.id}
              className="font-mono text-sm font-bold text-peat-forest"
              title={report.id}
            >
              {displayId}
            </span>
            {report.isDemoSample ? (
              <span className="rounded-full bg-peat-sun/25 px-2.5 py-1 text-[11px] font-semibold text-peat-forest">
                Sampel demo
              </span>
            ) : null}
            {report.hasPhoto ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-peat-forest/5 px-2.5 py-1 text-[11px] font-medium text-peat-forest">
                <Camera aria-hidden="true" size={12} />
                Bukti foto
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-peat-forest/65">
            Direkam {formatDate(report.capturedAt)}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-peat-forest">
            {zoneName ?? "Zona belum ditetapkan"}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs text-peat-forest/65">
            <MapPinned aria-hidden="true" size={13} />
            {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
            {report.accuracyMeters === null
              ? ""
              : " · ±" + Math.round(report.accuracyMeters) + " m"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(120px,1fr)_auto_auto] xl:min-w-[440px]">
          <div className="min-w-0">
            <p className="text-[11px] text-peat-forest/55">Kategori AI</p>
            <p className="mt-1 truncate text-sm font-semibold text-peat-forest">
              <ReportCategoryLabel category={report.aiCategory} />
            </p>
            <p className="mt-1 text-[11px] text-peat-forest/55">
              <AiStateLabel state={report.aiState} />
            </p>
          </div>
          <div>
            <p className="text-[11px] text-peat-forest/55">Urgensi</p>
            <div className="mt-1">
              <ReportUrgencyBadge urgency={report.aiUrgency} />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-peat-forest/55">Penanganan</p>
            <div className="mt-1">
              <ReportStatusBadge status={report.handlingStatus} />
            </div>
          </div>
        </div>

        <Link
          aria-label={"Lihat detail laporan " + displayId}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-peat-forest/15 px-4 text-sm font-semibold text-peat-forest hover:bg-peat-paper xl:shrink-0"
          href={reportDetailRoute(report.id)}
        >
          Lihat detail
          <ArrowUpRight aria-hidden="true" size={15} />
        </Link>
      </div>
    </li>
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
