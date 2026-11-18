import type { MrvDashboard } from "@/lib/server/mrv/contracts";

import { VillageRow } from "./village-row";

export function DashboardVillages({ dashboard }: { dashboard: MrvDashboard }) {
  return (
    <section
      aria-labelledby="dashboard-villages-title"
      className="audit-print-card overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs"
    >
      <div className="border-b border-peat-forest/10 px-5 py-5 sm:px-6">
        <h2
          className="font-heading text-2xl font-bold text-peat-forest"
          id="dashboard-villages-title"
        >
          Aktivitas dan estimasi per desa
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {dashboard.readiness.status === "available"
            ? `Kesiapsiagaan ilustratif ${dashboard.readiness.from} – ${dashboard.readiness.to}. Bobot setara untuk cakupan patroli dan respons dalam 24 jam.`
            : "Laporan adalah konteks aktivitas; insentif mengikuti estimasi zona."}
        </p>
      </div>
      {dashboard.villages.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse text-left">
            <caption className="sr-only">
              Laporan lapangan dan estimasi emisi dicegah per desa
            </caption>
            <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-muted-foreground">
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
                  Estimasi emisi dicegah
                </th>
                <th className="px-4 py-3 text-left" scope="col">
                  Estimasi insentif
                </th>
                {dashboard.readiness.status === "available" ? (
                  <th className="px-4 py-3 text-left" scope="col">
                    Kesiapsiagaan
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-peat-forest/10 text-sm">
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
