import { Clock3, Droplets, MapPinned } from "lucide-react";

import type { ReportDetail } from "@/components/command/reports/report-contracts";
import { formatDate } from "@/components/command/reports/report-card";
import { ReportDetailRow } from "@/components/command/reports/report-detail-row";

export function ReportLocationDetails({
  report,
  zoneName,
}: {
  report: ReportDetail;
  zoneName: string | null;
}) {
  return (
    <section
      aria-labelledby="report-location-heading"
      className="rounded-2xl border border-peat-forest/10 bg-white p-4"
    >
      <h2
        className="font-heading text-2xl font-bold text-peat-forest"
        id="report-location-heading"
      >
        Lokasi dan waktu
      </h2>
      <dl className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <ReportDetailRow
          icon={<MapPinned aria-hidden="true" size={15} />}
          label="Koordinat"
          value={
            <span className="font-mono">
              {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
            </span>
          }
        />
        <ReportDetailRow
          label="Akurasi GPS"
          value={
            report.accuracyMeters === null
              ? "Tidak tersedia"
              : "±" + Math.round(report.accuracyMeters) + " m"
          }
        />
        <ReportDetailRow label="Zona" value={zoneName ?? "Belum ditetapkan"} />
        <ReportDetailRow
          icon={<Droplets aria-hidden="true" size={15} />}
          label="Jarak sumber air terdekat"
          value={
            report.nearestWaterDistanceM === null
              ? "Tidak tersedia"
              : Math.round(report.nearestWaterDistanceM) + " m"
          }
        />
        <ReportDetailRow
          icon={<Clock3 aria-hidden="true" size={15} />}
          label="Waktu direkam"
          value={formatDate(report.capturedAt)}
        />
        <ReportDetailRow
          label="Waktu diterima POSKO"
          value={formatDate(report.syncedAt)}
        />
      </dl>
    </section>
  );
}
