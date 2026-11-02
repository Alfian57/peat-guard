import type {
  DashboardVillage,
  MrvDashboard,
} from "@/lib/server/mrv/contracts";

import { formatCarbon, formatCount, formatCurrency } from "../audit-formatters";

function VillageRow({ village }: { village: DashboardVillage }) {
  const totalReports = village.fieldReportCount + village.demoFieldReportCount;
  const triagedReports =
    village.aiTriagedFieldReportCount + village.demoAiTriagedFieldReportCount;

  return (
    <tr className="border-t border-border">
      <th
        className="px-4 py-4 text-left font-semibold text-peat-forest"
        scope="row"
      >
        <span>{village.villageName}</span>
        {village.isIllustrative ? (
          <span className="ml-2 inline-flex rounded-full bg-peat-sun/20 px-2 py-0.5 text-[0.65rem] font-semibold text-peat-forest">
            Demo
          </span>
        ) : null}
      </th>
      <td className="px-4 py-4 text-sm text-foreground">
        {formatCount(totalReports)}
        <span className="mt-1 block text-xs text-muted-foreground">
          {formatCount(triagedReports)} triase AI
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-foreground">
        {formatCount(village.zoneCount)}
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-peat-green">
        {formatCarbon(village.estimatedCarbonTons)}
      </td>
      <td className="px-4 py-4 text-sm text-foreground">
        {formatCurrency(village.estimatedIncentiveIdr)}
      </td>
    </tr>
  );
}

export function DashboardVillages({ dashboard }: { dashboard: MrvDashboard }) {
  return (
    <section
      aria-labelledby="dashboard-villages-title"
      className="audit-print-card overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
    >
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2
          className="font-heading text-2xl font-bold text-peat-forest"
          id="dashboard-villages-title"
        >
          Aktivitas dan estimasi per desa
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Laporan adalah konteks aktivitas; insentif mengikuti estimasi zona.
        </p>
      </div>
      {dashboard.villages.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse text-left">
            <caption className="sr-only">
              Laporan lapangan dan estimasi karbon per desa
            </caption>
            <thead className="bg-peat-paper/75 text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left" scope="col">
                  Desa
                </th>
                <th className="px-4 py-3 text-left" scope="col">
                  Laporan
                </th>
                <th className="px-4 py-3 text-left" scope="col">
                  Zona
                </th>
                <th className="px-4 py-3 text-left" scope="col">
                  Estimasi karbon
                </th>
                <th className="px-4 py-3 text-left" scope="col">
                  Estimasi insentif
                </th>
              </tr>
            </thead>
            <tbody>
              {dashboard.villages.map((village) => (
                <VillageRow key={village.villageName} village={village} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-7 text-sm text-muted-foreground sm:px-6">
          Belum ada aktivitas pada rentang tanggal ini.
        </p>
      )}
    </section>
  );
}
