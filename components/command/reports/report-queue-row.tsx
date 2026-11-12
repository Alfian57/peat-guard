import Link from "next/link";
import { ArrowUpRight, Camera, MapPinned } from "lucide-react";

import type { ReportListItem } from "@/components/command/reports/report-contracts";
import { formatDate } from "@/components/command/reports/report-date";
import {
  AiStateLabel,
  ReportCategoryLabel,
  ReportStatusBadge,
  ReportUrgencyBadge,
} from "@/components/command/reports/report-status-badge";
import { reportDetailRoute } from "@/components/command/routes";

export function ReportQueueRow({
  report,
  zones,
}: {
  report: ReportListItem;
  zones: ReadonlyMap<string, string>;
}) {
  const displayId = "PG-" + report.id.slice(0, 8).toUpperCase();
  const zoneName = report.zoneId ? (zones.get(report.zoneId) ?? null) : null;

  return (
    <tr className="transition-colors hover:bg-peat-forest/[0.02]">
      <td className="px-4 py-3.5 align-middle">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            aria-label={"ID laporan " + report.id}
            className="font-mono text-xs font-bold text-peat-forest"
            title={report.id}
          >
            {displayId}
          </span>
          {report.isDemoSample ? (
            <span className="rounded-full bg-peat-sun/25 px-2 py-0.5 text-[10px] font-semibold text-peat-forest">
              Sampel demo
            </span>
          ) : null}
          {report.hasPhoto ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-peat-forest/5 px-2 py-0.5 text-[10px] font-medium text-peat-forest"
              title="Bukti foto tersedia"
            >
              <Camera aria-hidden="true" size={11} />
              Foto
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] text-peat-forest/65">
          {formatDate(report.capturedAt)}
        </p>
      </td>

      <td className="px-4 py-3.5 align-middle">
        <p className="font-medium text-peat-forest">
          {zoneName ?? "Zona belum ditetapkan"}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-peat-forest/65">
          <MapPinned aria-hidden="true" size={12} />
          {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
          {report.accuracyMeters === null
            ? ""
            : " · ±" + Math.round(report.accuracyMeters) + " m"}
        </p>
      </td>

      <td className="px-4 py-3.5 align-middle">
        <div className="text-xs font-semibold text-peat-forest">
          <ReportCategoryLabel category={report.aiCategory} />
        </div>
        <div className="mt-0.5 text-[11px] text-peat-forest/60">
          <AiStateLabel state={report.aiState} />
        </div>
      </td>

      <td className="px-4 py-3.5 align-middle">
        <ReportUrgencyBadge urgency={report.aiUrgency} />
      </td>

      <td className="px-4 py-3.5 align-middle">
        <ReportStatusBadge status={report.handlingStatus} />
      </td>

      <td className="px-4 py-3.5 text-right align-middle">
        <Link
          aria-label={"Lihat detail laporan " + displayId}
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-peat-forest/20 px-3.5 text-xs font-semibold text-peat-forest transition-colors hover:border-peat-green/40 hover:bg-peat-paper hover:text-peat-green"
          href={reportDetailRoute(report.id)}
        >
          Lihat detail
          <ArrowUpRight aria-hidden="true" size={14} />
        </Link>
      </td>
    </tr>
  );
}

export { ReportQueueRow as ReportRow };
