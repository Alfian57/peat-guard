import { Droplets, MapPinned, Pencil, Trash2 } from "lucide-react";

import type { CommandWaterPoint } from "@/lib/server/water/data";

export function WaterPointCard({
  onDelete,
  onEdit,
  point,
}: {
  onDelete: (point: CommandWaterPoint) => void;
  onEdit: (point: CommandWaterPoint) => void;
  point: CommandWaterPoint;
}) {
  return (
    <li className="rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-800">
          <Droplets aria-hidden="true" size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-peat-forest">{point.name}</h2>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900">
              {waterPointTypeLabel(point.type)}
            </span>
          </div>
          <p className="mt-1 text-xs text-peat-forest/65">
            {point.zoneName ?? "Belum dikaitkan ke zona"}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-peat-forest/70">
            <MapPinned aria-hidden="true" size={13} />
            {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
          </p>
          {point.isDemoData ? (
            <p className="mt-1 text-xs text-peat-forest/55">Data ilustrasi</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex gap-2 border-t border-peat-forest/10 pt-3">
        <button
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-peat-forest/15 text-sm font-semibold text-peat-forest hover:bg-peat-paper"
          onClick={() => onEdit(point)}
          type="button"
        >
          <Pencil aria-hidden="true" className="text-amber-500" size={15} />
          Ubah
        </button>
        <button
          aria-label={"Hapus titik " + point.name}
          className="inline-grid min-h-11 min-w-11 place-items-center rounded-xl border border-border text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => onDelete(point)}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} />
        </button>
      </div>
    </li>
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
