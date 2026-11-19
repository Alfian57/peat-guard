import { SatelliteDish } from "lucide-react";
import { PublicMapInfoPopover } from "@/components/public/public-map-info-popover";
import { hotspotSourceLabel } from "@/lib/firms-labels";
import type { PublicMapData } from "@/lib/public/contracts";

function formatDate(value: string | null) {
  if (value === null) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function PublicMapFreshness({
  freshness,
}: {
  freshness: PublicMapData["freshness"];
}) {
  const lastSuccessfulAt = formatDate(freshness.lastDataSyncAt);
  const descriptions = {
    fresh: `Sinkronisasi berhasil ${lastSuccessfulAt}.`,
    partial: freshness.failedSources.length
      ? `Pembaruan parsial ${lastSuccessfulAt}. Sumber gagal: ${freshness.failedSources.map(hotspotSourceLabel).join(", ")}.`
      : `Pembaruan parsial tercatat ${lastSuccessfulAt}.`,
    stale: `Pembaruan terakhir ${lastSuccessfulAt}. Data mungkin tertinggal dari kondisi terbaru.`,
    unavailable: "Belum ada sinkronisasi NASA FIRMS yang berhasil tercatat.",
    not_configured:
      "Sinkronisasi NASA FIRMS belum dikonfigurasi di lingkungan ini.",
    configuration_error:
      "Konfigurasi sinkronisasi NASA FIRMS perlu diperiksa. Data peta tetap ditampilkan.",
  } as const;

  return (
    <PublicMapInfoPopover title="Status data satelit" icon={SatelliteDish}>
      <p className="font-medium">{freshness.provider}</p>
      <p>{descriptions[freshness.status]}</p>
      {freshness.configured ? (
        <p>
          {freshness.expectedIntervalMinutes === null
            ? "Interval worker tidak tersedia karena konfigurasi perlu diperbaiki."
            : `Worker dijadwalkan setiap ${freshness.expectedIntervalMinutes} menit.`}{" "}
          Penanda ini mengikuti catatan sinkronisasi sukses terakhir.
        </p>
      ) : null}
      <p>
        Hotspot satelit adalah indikasi penginderaan jauh, bukan konfirmasi
        kejadian kebakaran. Titik demo selalu ditandai sebagai ilustrasi.
      </p>
    </PublicMapInfoPopover>
  );
}
