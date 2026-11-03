import Link from "next/link";
import { Droplets, Flame, MapPinned } from "lucide-react";

import { ReportUrgencyBadge } from "@/components/command/reports/report-status-badge";
import { reportDetailRoute } from "@/components/command/routes";
import type { MapPoint, MapZone } from "@/lib/maps/types";

export function MapInspector({
  zone,
  point,
}: {
  zone: MapZone | null;
  point: MapPoint | null;
}) {
  if (zone) {
    return (
      <div className="rounded-2xl border border-peat-forest/10 bg-white p-4">
        <div className="flex items-start gap-3">
          <MapPinned
            aria-hidden="true"
            className="mt-0.5 text-peat-green"
            size={19}
          />
          <div>
            <p className="font-semibold text-peat-forest">{zone.name}</p>
            <p className="mt-1 text-sm text-peat-forest/70">
              {new Intl.NumberFormat("id-ID", {
                maximumFractionDigits: 1,
              }).format(zone.areaHectares)}{" "}
              ha
              {zone.isDemoData ? " · data ilustrasi" : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (point) {
    const isWater = point.kind === "water";
    const Icon = isWater ? Droplets : Flame;

    return (
      <div className="rounded-2xl border border-peat-forest/10 bg-white p-4">
        <div className="flex items-start gap-3">
          <Icon
            aria-hidden="true"
            className={
              isWater ? "mt-0.5 text-sky-700" : "mt-0.5 text-orange-700"
            }
            size={19}
          />
          <div>
            <p className="font-semibold text-peat-forest">{point.label}</p>
            {point.description ? (
              <p className="mt-1 text-sm leading-5 text-peat-forest/70">
                {point.description}
              </p>
            ) : null}
            {point.kind === "report" ? (
              <div className="mt-2">
                <ReportUrgencyBadge urgency={point.urgency ?? null} />
              </div>
            ) : null}
            {point.isDemoData ? (
              <p className="mt-2 text-xs font-medium text-peat-forest/60">
                Sampel demo
              </p>
            ) : null}
            <p className="mt-2 font-mono text-xs text-peat-forest/60">
              {point.coordinates[1].toFixed(5)},{" "}
              {point.coordinates[0].toFixed(5)}
            </p>
            {point.kind === "report" ? (
              <Link
                className="mt-3 inline-flex min-h-10 items-center rounded-lg font-semibold text-peat-green underline underline-offset-2"
                href={reportDetailRoute(point.id)}
              >
                Buka detail laporan
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-peat-forest/20 bg-white/70 p-4 text-sm leading-6 text-peat-forest/65">
      Pilih zona, titik air, atau hotspot pada peta untuk melihat ringkasannya.
    </div>
  );
}
