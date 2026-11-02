import { Info } from "lucide-react";

import type { MrvDashboard, ZoneImpact } from "@/lib/server/mrv/contracts";

import {
  formatCarbon,
  formatCurrency,
  formatDecimal,
  formatHectares,
} from "../audit-formatters";

function ZoneFactorRow({ zone }: { zone: ZoneImpact }) {
  return (
    <tr className="border-t border-border text-sm">
      <th
        className="px-3 py-3 text-left font-semibold text-peat-forest"
        scope="row"
      >
        <span className="block">{zone.zoneName}</span>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          {zone.villageName ?? "Desa tidak diketahui"}
          {zone.isIllustrative ? " · data ilustratif" : ""}
        </span>
        <span
          className="mt-1 block max-w-52 truncate font-mono text-[0.65rem] font-normal text-muted-foreground"
          title={`Parameter ${zone.parameters.name} · ${zone.parameters.parameterSetId}`}
        >
          {zone.parameters.name} · {zone.parameters.parameterSetId}
        </span>
      </th>
      <td className="px-3 py-3 font-mono text-xs">
        {formatHectares(zone.areaHectares)}
      </td>
      <td className="px-3 py-3 font-mono text-xs">
        {formatDecimal(zone.parameters.biomassFactorTonsCarbonPerHectare)}
      </td>
      <td className="px-3 py-3 font-mono text-xs">
        {formatDecimal(zone.parameters.emissionFactor)}
      </td>
      <td className="px-3 py-3 font-mono text-xs">
        {formatDecimal(zone.parameters.co2ConversionFactor)}
      </td>
      <td className="px-3 py-3 font-semibold text-peat-green">
        {formatCarbon(zone.estimatedCarbonTons)}
      </td>
      <td className="px-3 py-3 text-xs text-muted-foreground">
        {formatCurrency(zone.estimatedIncentiveIdr)}
      </td>
    </tr>
  );
}

export function DashboardCarbonDetails({
  dashboard,
}: {
  dashboard: MrvDashboard;
}) {
  return (
    <section
      aria-labelledby="dashboard-carbon-title"
      className="audit-print-card overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
        <div>
          <h2
            className="font-heading text-2xl font-bold text-peat-forest"
            id="dashboard-carbon-title"
          >
            Cara angka karbon dihitung
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimasi deterministik dengan parameter tersimpan pada setiap zona.
          </p>
        </div>
        <p className="rounded-lg bg-peat-paper px-3 py-2 font-mono text-sm font-semibold text-peat-green">
          {dashboard.calculation.formula}
        </p>
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-4 text-sm sm:grid-cols-3 sm:px-6">
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
      </div>

      {dashboard.zones.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <caption className="sr-only">
              Parameter dan estimasi karbon untuk setiap zona yang disetujui
            </caption>
            <thead className="bg-peat-paper/75 text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left" scope="col">
                  Zona
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  A · Luas
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  B · Faktor
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  EF
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  Konversi
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  E_saved
                </th>
                <th className="px-3 py-3 text-left" scope="col">
                  Insentif
                </th>
              </tr>
            </thead>
            <tbody>
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

      <p className="flex items-start gap-2 border-t border-border bg-peat-paper/60 px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
        <Info
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-peat-green"
          size={15}
        />
        Parameter demo bersifat ilustratif. Estimasi ini bukan kredit karbon
        tersertifikasi. Riwayat patroli ditampilkan terpisah dan tidak ditambah
        berulang ke total karbon zona.
      </p>
    </section>
  );
}
