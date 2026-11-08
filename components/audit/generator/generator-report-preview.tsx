import type { MrvGeneratedReport } from "@/lib/server/mrv/contracts";

import {
  formatCarbon,
  formatCount,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDecimal,
  formatHectares,
} from "../audit-formatters";
import { GeneratorMetric as Metric } from "./generator-metric";
import { NarrativeSection } from "./narrative-section";

export function GeneratorReportPreview({
  report,
}: {
  report: MrvGeneratedReport;
}) {
  const isCarbonAudit = report.documentType === "CARBON_AUDIT";

  return (
    <article className="audit-print-document rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7 lg:p-9">
      <header className="border-b border-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-heading text-lg font-bold tracking-wide text-peat-green">
              PEATGUARD
            </p>
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
            Estimasi karbon bukan kredit tersertifikasi.
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
        <dl className="mt-3 grid gap-x-10 sm:grid-cols-2">
          <Metric
            label="Titik panas satelit"
            note={`${formatCount(report.metrics.hotspots.nonDemoCount)} observasi non-demo · ${formatCount(report.metrics.hotspots.demoCount)} demo`}
            value={formatCount(report.metrics.hotspots.totalCount)}
          />
          <Metric
            label="Laporan lapangan"
            note={`${formatCount(report.metrics.reports.aiTriagedCount)} telah ditriase AI`}
            value={formatCount(report.metrics.reports.totalCount)}
          />
          <Metric
            label="Laporan belum selesai"
            note={`${formatCount(report.metrics.reports.closedCount)} selesai`}
            value={formatCount(report.metrics.reports.activeCount)}
          />
          <Metric
            label="Rata-rata waktu respons"
            note={
              report.metrics.responseTime.status === "available"
                ? `Dari laporan diterima hingga status pertama ditangani · ${formatCount(report.metrics.responseTime.respondedReportCount)} laporan`
                : "Belum ada laporan dengan waktu respons tercatat"
            }
            value={
              report.metrics.responseTime.averageMinutes === null
                ? "Belum tersedia"
                : `${formatDecimal(report.metrics.responseTime.averageMinutes)} menit`
            }
          />
          <Metric
            label="Estimasi emisi dicegah"
            note={
              report.metrics.carbon.asOf
                ? `Snapshot zona disetujui sampai ${formatDateTime(report.metrics.carbon.asOf)}`
                : "Riwayat snapshot tidak tersedia untuk periode ini"
            }
            value={
              report.metrics.carbon.estimatedCarbonTons === null
                ? "Belum tersedia"
                : formatCarbon(report.metrics.carbon.estimatedCarbonTons)
            }
          />
          <Metric
            label="Area zona disetujui"
            value={
              report.metrics.carbon.protectedAreaHectares === null
                ? "Belum tersedia"
                : formatHectares(report.metrics.carbon.protectedAreaHectares)
            }
          />
          <Metric
            label="Estimasi insentif"
            note="Ilustrasi CO₂e × tarif tersimpan; bukan formula insentif patroli final."
            value={
              report.metrics.carbon.estimatedIncentiveIdr === null
                ? "Belum tersedia"
                : formatCurrency(report.metrics.carbon.estimatedIncentiveIdr)
            }
          />
          <Metric
            label="Kondisi sekat kanal"
            note="Skema belum menyimpan kondisi kanal hasil observasi"
            value="Belum tersedia"
          />
        </dl>
      </section>

      <section
        aria-labelledby="generator-zones-title"
        className="border-t border-border py-5"
      >
        <h3
          className="font-heading text-2xl font-bold text-peat-forest"
          id="generator-zones-title"
        >
          Estimasi karbon per zona
        </h3>
        {report.metrics.carbon.status === "unavailable" ? (
          <p className="mt-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-foreground">
            Riwayat snapshot karbon belum tersedia pada periode yang dipilih.
            Nilai karbon tidak dihitung dari data saat ini untuk menggantikan
            riwayat tersebut.
          </p>
        ) : report.metrics.carbon.zones.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[570px] border-collapse text-left">
              <caption className="sr-only">
                Estimasi area, emisi, dan insentif setiap zona yang disetujui
              </caption>
              <thead className="bg-peat-paper text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 text-left" scope="col">
                    Zona
                  </th>
                  <th className="px-3 py-2.5 text-left" scope="col">
                    Area
                  </th>
                  <th className="px-3 py-2.5 text-left" scope="col">
                    Emisi
                  </th>
                  <th className="px-3 py-2.5 text-left" scope="col">
                    Insentif
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.metrics.carbon.zones.map((zone) => (
                  <tr
                    className="border-t border-border text-sm"
                    key={zone.zoneId}
                  >
                    <th
                      className="px-3 py-3 text-left font-semibold text-peat-forest"
                      scope="row"
                    >
                      {zone.zoneName}
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        Snapshot {formatDateTime(zone.snapshotAt)} ·{" "}
                        {zone.snapshotReason.replaceAll("_", " ").toLowerCase()}
                      </span>
                      {zone.isIllustrative ? (
                        <span className="mt-1 block text-xs font-normal text-warning">
                          Data ilustratif
                        </span>
                      ) : null}
                    </th>
                    <td className="px-3 py-3 text-foreground">
                      {formatHectares(zone.areaHectares)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-peat-green">
                      {formatCarbon(zone.estimatedCarbonTons)}
                    </td>
                    <td className="px-3 py-3 text-foreground">
                      {formatCurrency(zone.estimatedIncentiveIdr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Tidak ada zona yang cocok dengan filter laporan.
          </p>
        )}
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Laporan patroli dan hotspot merupakan konteks aktivitas, bukan
          kontribusi karbon tambahan di luar estimasi zona.
        </p>
      </section>

      <section
        aria-labelledby="generator-narrative-title"
        className="border-t border-border py-5"
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
      <footer className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        Draf dibuat dari data PEATGUARD pada{" "}
        {formatDate(report.generatedAt.slice(0, 10))}. Tinjau catatan dan bukti
        sebelum laporan diterbitkan.
      </footer>
    </article>
  );
}
