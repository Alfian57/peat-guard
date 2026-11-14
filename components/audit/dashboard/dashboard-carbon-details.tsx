import { Info } from "lucide-react";

import type { MrvDashboard } from "@/lib/server/mrv/contracts";

import { ZoneFactorRow } from "./zone-factor-row";

export function DashboardCarbonDetails({
  dashboard,
}: {
  dashboard: MrvDashboard;
}) {
  return (
    <section
      aria-labelledby="dashboard-carbon-title"
      className="audit-print-card min-w-0 overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs"
    >
      <header className="border-b border-peat-forest/10 px-5 py-4 sm:px-6">
        <h2
          className="font-heading text-2xl font-bold text-peat-forest"
          id="dashboard-carbon-title"
        >
          Cara menghitung estimasi emisi dicegah
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimasi deterministik dengan parameter tersimpan pada setiap zona.
        </p>
      </header>
      <p className="px-5 pt-4 font-mono text-xs wrap-anywhere text-peat-forest sm:px-6">
        {dashboard.calculation.formula}
      </p>

      <div className="grid gap-3 border-b border-peat-forest/10 px-5 py-4 text-sm sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
        <p>
          <span className="font-mono font-semibold text-peat-green">A</span>
          <span className="ml-2 text-muted-foreground">luas zona (ha)</span>
        </p>
        <p>
          <span className="font-mono font-semibold text-peat-green">B</span>
          <span className="ml-2 text-muted-foreground">
            biomassa gambut (t C/ha)
          </span>
        </p>
        <p>
          <span className="font-mono font-semibold text-peat-green">EF</span>
          <span className="ml-2 text-muted-foreground">faktor emisi</span>
        </p>
        <p>
          <span className="font-mono font-semibold text-peat-green">
            conversion
          </span>
          <span className="ml-2 text-muted-foreground">
            faktor konversi CO₂e
          </span>
        </p>
      </div>

      {dashboard.zones.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <caption className="sr-only">
              Parameter dan estimasi emisi dicegah untuk setiap zona yang
              disetujui
            </caption>
            <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left" scope="col">
                  Zona gambut
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  Luas zona
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  Biomassa gambut (t C/ha)
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  Faktor emisi (EF)
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  Konversi CO₂e
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  Estimasi emisi dicegah
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  Estimasi insentif
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peat-forest/10 text-sm">
              {dashboard.zones.map((zone) => (
                <ZoneFactorRow key={zone.zoneId} zone={zone} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
          Belum ada zona gambut yang disetujui untuk dihitung.
        </p>
      )}

      <p className="flex items-start gap-2 border-t border-peat-forest/10 bg-peat-paper/60 px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
        <Info
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-peat-green"
          size={15}
        />
        Parameter demo bersifat ilustratif. Estimasi ini bukan kredit karbon
        tersertifikasi. Riwayat patroli ditampilkan terpisah dan tidak ditambah
        berulang ke total estimasi emisi dicegah zona.
      </p>
    </section>
  );
}
