import type { ZoneImpact } from "@/lib/server/mrv/contracts";
import {
  formatCarbon,
  formatCurrency,
  formatDecimal,
  formatHectares,
} from "../audit-formatters";

export function ZoneFactorRow({ zone }: { zone: ZoneImpact }) {
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
