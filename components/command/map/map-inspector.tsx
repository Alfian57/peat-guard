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
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <MapPinned
            aria-hidden="true"
            className="shrink-0 text-peat-green"
            size={19}
          />
          <p className="min-w-0 text-sm font-semibold wrap-anywhere text-peat-forest">
            {zone.name}
          </p>
        </div>
        <div className="mt-3 min-w-0">
          <p className="mt-1 text-sm text-muted-foreground">
            {new Intl.NumberFormat("id-ID", {
              maximumFractionDigits: 1,
            }).format(zone.areaHectares)}{" "}
            ha
            {zone.isDemoData ? " · data ilustrasi" : ""}
          </p>
        </div>
      </div>
    );
  }

  if (point) {
    const isWater = point.kind === "water";
    const Icon = isWater ? Droplets : Flame;

    return (
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Icon
            aria-hidden="true"
            className={
              isWater ? "shrink-0 text-sky-700" : "shrink-0 text-orange-700"
            }
            size={19}
          />
          <p className="min-w-0 text-sm font-semibold wrap-anywhere text-peat-forest">
            {point.label}
          </p>
        </div>
        <div className="mt-3 min-w-0">
          {point.description ? (
            <p className="mt-1 text-xs leading-5 wrap-anywhere text-muted-foreground">
              {point.description}
            </p>
          ) : null}
          {point.kind === "report" ? (
            <div className="mt-2">
              <ReportUrgencyBadge urgency={point.urgency ?? null} />
            </div>
          ) : null}
          {point.isDemoData ? (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Sampel demo
            </p>
          ) : null}
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {point.coordinates[1].toFixed(5)}, {point.coordinates[0].toFixed(5)}
          </p>
          {point.kind === "report" ? (
            <Link
              className="mt-3 inline-flex min-h-11 items-center rounded-lg text-xs font-semibold text-peat-forest underline underline-offset-2"
              href={reportDetailRoute(point.id)}
            >
              Buka detail laporan
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="text-xs leading-5 text-muted-foreground">
      Pilih zona atau pin pada peta untuk melihat ringkasannya.
    </div>
  );
}
