import type { DashboardVillage } from "@/lib/server/mrv/contracts";
import { formatCarbon, formatCount, formatCurrency } from "../audit-formatters";

export function VillageRow({ village }: { village: DashboardVillage }) {
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
