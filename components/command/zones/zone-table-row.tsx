import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { zoneEditRoute } from "@/components/command/routes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CommandZone } from "@/lib/server/zones/data";
import { zoneVerificationStatusLabel } from "@/lib/zone-labels";

export function ZoneTableRow({
  onDelete,
  waterPointCount,
  zone,
}: {
  onDelete: (zone: CommandZone) => void;
  waterPointCount: number;
  zone: CommandZone;
}) {
  return (
    <tr className="transition-colors hover:bg-peat-forest/[0.02]">
      <td className="px-4 py-3.5 align-middle">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-peat-forest">{zone.name}</span>
          {zone.isDemoData ? (
            <span className="rounded-full bg-peat-sun/25 px-2 py-0.5 text-[10px] font-semibold text-peat-forest">
              Data ilustratif
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-peat-forest/65">
          {zone.villageName || "Desa belum ditentukan"}
        </p>
      </td>

      <td className="px-4 py-3.5 align-middle">
        <span
          className={
            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " +
            (zone.isApproved
              ? "bg-safe/10 text-safe"
              : "bg-peat-sun/30 text-peat-forest")
          }
        >
          {zoneVerificationStatusLabel(zone.isApproved)}
        </span>
      </td>

      <td className="px-4 py-3.5 align-middle font-mono text-xs text-peat-forest/80">
        {formatNumber(zone.areaHectares, 1)} ha
      </td>

      <td className="px-4 py-3.5 align-middle font-mono text-xs text-peat-forest/80">
        {formatNumber(zone.peatDepthMeters, 2)} m
      </td>

      <td className="px-4 py-3.5 align-middle font-mono text-xs text-peat-forest/80">
        {formatNumber(zone.carbonFactor, 2)}
      </td>

      <td className="px-4 py-3.5 align-middle font-mono text-xs text-peat-forest/80">
        {formatNumber(waterPointCount)} titik
      </td>

      <td className="px-4 py-3.5 text-right align-middle">
        <div className="inline-flex items-center justify-end gap-1.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  aria-label={"Ubah zona " + zone.name}
                  className="inline-grid size-9 h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white text-amber-500 shadow-xs transition-colors hover:border-peat-forest/25 hover:bg-amber-50 hover:text-amber-600"
                  href={zoneEditRoute(zone.id)}
                >
                  <Pencil aria-hidden="true" size={15} />
                </Link>
              }
            />
            <TooltipContent>Ubah zona</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  aria-label={"Arsipkan zona " + zone.name}
                  className="inline-grid size-9 h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-white text-red-600 shadow-xs transition-colors hover:border-peat-forest/25 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onDelete(zone)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                </button>
              }
            />
            <TooltipContent>Arsipkan zona</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(
    value,
  );
}
