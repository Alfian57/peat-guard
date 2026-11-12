import Link from "next/link";
import { Droplets, MapPinned, Pencil, Trash2 } from "lucide-react";

import { COMMAND_ROUTES } from "@/components/command/routes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CommandWaterPoint } from "@/lib/server/water/data";

export function WaterPointTableRow({
  onDelete,
  point,
}: {
  onDelete: (point: CommandWaterPoint) => void;
  point: CommandWaterPoint;
}) {
  return (
    <tr className="transition-colors hover:bg-peat-forest/[0.02]">
      <td className="px-4 py-3.5 align-middle">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-800">
            <Droplets aria-hidden="true" size={16} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-peat-forest">
                {point.name}
              </span>
              {point.isDemoData ? (
                <span className="rounded-full bg-peat-sun/25 px-2 py-0.5 text-[10px] font-semibold text-peat-forest">
                  Data ilustrasi
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5 align-middle">
        <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900">
          {waterPointTypeLabel(point.type)}
        </span>
      </td>

      <td className="px-4 py-3.5 align-middle text-sm text-peat-forest/80">
        {point.zoneName ?? "Belum dikaitkan ke zona"}
      </td>

      <td className="px-4 py-3.5 align-middle">
        <span className="inline-flex items-center gap-1 font-mono text-xs text-peat-forest/70">
          <MapPinned aria-hidden="true" size={13} />
          {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
        </span>
      </td>

      <td className="px-4 py-3.5 text-right align-middle">
        <div className="inline-flex items-center justify-end gap-1.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  aria-label={"Ubah titik " + point.name}
                  className="inline-grid size-9 h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white text-amber-500 shadow-xs transition-colors hover:border-peat-forest/25 hover:bg-amber-50 hover:text-amber-600"
                  href={COMMAND_ROUTES.editWaterPoint(point.id)}
                >
                  <Pencil aria-hidden="true" size={15} />
                </Link>
              }
            />
            <TooltipContent>Ubah titik air</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  aria-label={"Hapus titik " + point.name}
                  className="inline-grid size-9 h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-white text-red-600 shadow-xs transition-colors hover:border-peat-forest/25 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onDelete(point)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                </button>
              }
            />
            <TooltipContent>Hapus titik air</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

function waterPointTypeLabel(type: CommandWaterPoint["type"]): string {
  switch (type) {
    case "SEKAT_KANAL":
      return "Sekat kanal";
    case "EMBUNG":
      return "Embung";
    case "SUMBER_AIR":
      return "Sumber air";
  }
}
