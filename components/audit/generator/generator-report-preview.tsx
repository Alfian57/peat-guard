import type {
  CarbonSnapshotReason,
  MrvGeneratedReport,
} from "@/lib/server/mrv/contracts";
import { BrandLogo } from "@/components/brand/brand-logo";

import {
  formatCarbon,
  formatCount,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDecimal,
  formatHectares,
} from "../audit-formatters";
import { NarrativeSection } from "./narrative-section";

const CARBON_SNAPSHOT_REASON_LABELS: Record<CarbonSnapshotReason, string> = {
  INITIAL_BASELINE: "Data dasar awal",
  PARAMETER_SET_CREATED: "Parameter dibuat",
  PARAMETER_SET_UPDATED: "Parameter diperbarui",
  ZONE_CREATED: "Zona dibuat",
  ZONE_UPDATED: "Batas zona diperbarui",
};

export function GeneratorReportPreview({
  report,
}: {
  report: MrvGeneratedReport;
}) {
  const isCarbonAudit = report.documentType === "CARBON_AUDIT";

  return (
    <article className="audit-print-document min-w-0 flex-1">
      <header className="border-b border-peat-forest/10 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <BrandLogo height={36} />
            <p className="mt-5 text-xs font-semibold tracking-wide text-peat-green uppercase">
              {isCarbonAudit
                ? "Audit karbon bulanan"
                : "Laporan situasi harian"}
            </p>
            <h2 className="mt-1 font-heading text-3xl leading-tight font-bold text-peat-forest sm:text-4xl">
              {report.printable.title}
            </h2>
          </div>
          <div className="text-right text-xs leading-5 text-muted-foreground">
            <p>
              Dibuat {formatDate(report.printable.generatedAt.slice(0, 10))}
            </p>
            <p>
              Periode {formatDate(report.printable.period.from)} –{" "}
              {formatDate(report.printable.period.to)}
            </p>
            {report.scope.zoneName ? (
              <p>Wilayah {report.scope.zoneName}</p>
            ) : null}
          </div>
        </div>
        {report.containsIllustrativeData ? (
          <p className="mt-5 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm font-semibold text-foreground">
            Data demo atau parameter ilustratif termasuk dalam laporan ini.
            Estimasi emisi dicegah bukan kredit karbon tersertifikasi.
          </p>
        ) : null}
      </header>

      <section aria-labelledby="generator-metrics-title" className="py-5">
        <h3
          className="font-heading text-2xl font-bold text-peat-forest"
          id="generator-metrics-title"
        >
          Ringkasan metrik
        </h3>
        <div className="mt-3 overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <caption className="sr-only">
                Ringkasan metrik temuan patroli, respons, dan estimasi emisi
                dicegah
              </caption>
              <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3" scope="col">
                    Indikator & Metrik
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Nilai / Capaian
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-peat-forest/10 text-sm">
                <tr className="hover:bg-peat-forest/[0.02]">
                  <td className="px-4 py-3 font-medium text-peat-forest">
                    Titik panas satelit
                  </td>
                  <td className="px-4 py-3 font-semibold text-peat-forest">
                    {formatCount(report.metrics.hotspots.totalCount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{`${formatCount(report.metrics.hotspots.nonDemoCount)} observasi non-demo · ${formatCount(report.metrics.hotspots.demoCount)} demo`}</td>
                </tr>
                <tr className="hover:bg-peat-forest/[0.02]">
                  <td className="px-4 py-3 font-medium text-peat-forest">
                    Laporan lapangan
                  </td>
                  <td className="px-4 py-3 font-semibold text-peat-forest">
                    {formatCount(report.metrics.reports.totalCount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{`${formatCount(report.metrics.reports.aiTriagedCount)} telah ditriase AI`}</td>
                </tr>
                <tr className="hover:bg-peat-forest/[0.02]">
                  <td className="px-4 py-3 font-medium text-peat-forest">
                    Laporan belum selesai
                  </td>
                  <td className="px-4 py-3 font-semibold text-peat-forest">
                    {formatCount(report.metrics.reports.activeCount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{`${formatCount(report.metrics.reports.closedCount)} selesai`}</td>
                </tr>
                <tr className="hover:bg-peat-forest/[0.02]">
                  <td className="px-4 py-3 font-medium text-peat-forest">
                    Rata-rata waktu respons
                  </td>
                  <td className="px-4 py-3 font-semibold text-peat-forest">
                    {report.metrics.responseTime.averageMinutes === null
                      ? "Belum tersedia"
                      : `${formatDecimal(report.metrics.responseTime.averageMinutes)} menit`}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {report.metrics.responseTime.status === "available"
                      ? `Dari laporan diterima hingga status pertama ditangani · ${formatCount(report.metrics.responseTime.respondedReportCount)} laporan`
                      : "Belum ada laporan dengan waktu respons tercatat"}
                  </td>
                </tr>
                <tr className="hover:bg-peat-forest/[0.02]">
                  <td className="px-4 py-3 font-medium text-peat-forest">
                    Estimasi emisi dicegah
                  </td>
                  <td className="px-4 py-3 font-semibold text-peat-green">
                    {report.metrics.carbon.estimatedCarbonTons === null
                      ? "Belum tersedia"
                      : formatCarbon(report.metrics.carbon.estimatedCarbonTons)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {report.metrics.carbon.asOf
                      ? `Snapshot zona disetujui sampai ${formatDateTime(report.metrics.carbon.asOf)}`
                      : "Riwayat snapshot tidak tersedia untuk periode ini"}
                  </td>
                </tr>
                <tr className="hover:bg-peat-forest/[0.02]">
                  <td className="px-4 py-3 font-medium text-peat-forest">
                    Area zona disetujui
                  </td>
                  <td className="px-4 py-3 font-semibold text-peat-forest">
                    {report.metrics.carbon.protectedAreaHectares === null
                      ? "Belum tersedia"
                      : formatHectares(
                          report.metrics.carbon.protectedAreaHectares,
                        )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">-</td>
                </tr>
                <tr className="hover:bg-peat-forest/[0.02]">
                  <td className="px-4 py-3 font-medium text-peat-forest">
                    Estimasi insentif
                  </td>
                  <td className="px-4 py-3 font-semibold text-peat-forest">
                    {report.metrics.carbon.estimatedIncentiveIdr === null
                      ? "Belum tersedia"
                      : formatCurrency(
                          report.metrics.carbon.estimatedIncentiveIdr,
                        )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    Ilustrasi CO₂e × tarif tersimpan; bukan formula insentif
                    patroli final.
                  </td>
                </tr>
                <tr className="hover:bg-peat-forest/[0.02]">
                  <td className="px-4 py-3 font-medium text-peat-forest">
                    Kondisi sekat kanal
                  </td>
                  <td className="px-4 py-3 font-semibold text-peat-forest">
                    Belum tersedia
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    Skema belum menyimpan kondisi kanal hasil observasi
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="generator-zones-title"
        className="border-t border-peat-forest/10 py-5"
      >
        <h3
          className="font-heading text-2xl font-bold text-peat-forest"
          id="generator-zones-title"
        >
          Estimasi emisi dicegah per zona
        </h3>
        {report.metrics.carbon.status === "unavailable" ? (
          <p className="mt-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-foreground">
            Riwayat snapshot karbon belum tersedia pada periode yang dipilih.
            Nilai karbon tidak dihitung dari data saat ini untuk menggantikan
            riwayat tersebut.
          </p>
        ) : report.metrics.carbon.zones.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[570px] border-collapse text-left">
                <caption className="sr-only">
                  Estimasi luas, emisi dicegah, dan insentif setiap zona yang
                  disetujui
                </caption>
                <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3" scope="col">
                      Zona gambut
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Luas zona
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Estimasi emisi dicegah
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Estimasi insentif
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-peat-forest/10 text-sm">
                  {report.metrics.carbon.zones.map((zone) => (
                    <tr
                      className="transition-colors hover:bg-peat-forest/[0.02]"
                      key={zone.zoneId}
                    >
                      <th
                        className="px-4 py-3 text-left font-semibold text-peat-forest"
                        scope="row"
                      >
                        {zone.zoneName}
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          Snapshot {formatDateTime(zone.snapshotAt)} ·{" "}
                          {CARBON_SNAPSHOT_REASON_LABELS[zone.snapshotReason]}
                        </span>
                        {zone.isIllustrative ? (
                          <span className="mt-1 block text-xs font-normal text-warning">
                            Data ilustratif
                          </span>
                        ) : null}
                      </th>
                      <td className="px-4 py-3 text-foreground">
                        {formatHectares(zone.areaHectares)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-peat-green">
                        {formatCarbon(zone.estimatedCarbonTons)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatCurrency(zone.estimatedIncentiveIdr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada data zona disetujui pada periode ini.
          </p>
        )}
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Laporan patroli dan hotspot merupakan konteks aktivitas, bukan
          kontribusi karbon tambahan di luar estimasi zona.
        </p>
      </section>

      <section
        aria-labelledby="generator-narrative-title"
        className="border-t border-peat-forest/10 py-5"
      >
        <h3
          className="font-heading text-2xl font-bold text-peat-forest"
          id="generator-narrative-title"
        >
          Ringkasan eksekutif
        </h3>
        <div className="mt-3">
          <NarrativeSection report={report} />
        </div>
      </section>

      <footer className="border-t border-peat-forest/10 pt-4 text-xs leading-5 text-muted-foreground">
        Draf dibuat dari data PEATGUARD pada{" "}
        {formatDate(report.generatedAt.slice(0, 10))}. Tinjau catatan dan bukti
        sebelum laporan diterbitkan.
      </footer>
    </article>
  );
}
