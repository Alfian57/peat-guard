import Link from "next/link";
import { Trash2 } from "lucide-react";

import { zoneEditRoute } from "@/components/command/routes";
import { ZoneCardMetric } from "@/components/command/zones/zone-card-metric";
import type { CommandZone } from "@/lib/server/zones/data";

export function ZoneCard({
  onDelete,
  waterPointCount,
  zone,
}: {
  onDelete: (zone: CommandZone) => void;
  waterPointCount: number;
  zone: CommandZone;
}) {
  return (
    <li className="rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl leading-tight font-bold text-peat-forest">
            {zone.name}
          </h2>
          <p className="mt-1 text-sm text-peat-forest/65">
            {zone.villageName || "Nama desa belum diisi"}
          </p>
        </div>
        <span
          className={
            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold " +
            (zone.isApproved
              ? "bg-safe/10 text-safe"
              : "bg-peat-sun/30 text-peat-forest")
          }
        >
          {zone.isApproved ? "Disetujui" : "Menunggu verifikasi"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-peat-paper p-3">
        <ZoneCardMetric
          label="Luas terhitung"
          value={formatNumber(zone.areaHectares, 1) + " ha"}
        />
        <ZoneCardMetric
          label="Kedalaman gambut"
          value={formatNumber(zone.peatDepthMeters, 2) + " m"}
        />
        <ZoneCardMetric
          label="Faktor karbon"
          value={formatNumber(zone.carbonFactor, 2)}
        />
        <ZoneCardMetric
          label="Titik sumber air"
          value={formatNumber(waterPointCount)}
        />
      </div>

      {zone.isDemoData ? (
        <p className="mt-3 text-xs font-medium text-peat-forest/60">
          Data ilustrasi
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Link
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest hover:bg-peat-forest/5"
          href={zoneEditRoute(zone.id)}
        >
          Ubah zona
        </Link>
        <button
          aria-label={"Hapus zona " + zone.name}
          className="inline-grid min-h-11 min-w-11 place-items-center rounded-xl border border-red-900/15 text-red-800 hover:bg-red-50"
          onClick={() => onDelete(zone)}
          type="button"
        >
          <Trash2 aria-hidden="true" size={17} />
        </button>
      </div>
    </li>
  );
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(
    value,
  );
}
