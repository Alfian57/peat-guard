import type { PublicMapData } from "@/lib/public/contracts";
import { hotspotSourceLabel } from "@/lib/firms-labels";

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
    stale: `Pembaruan terakhir ${lastSuccessfulAt}; data mungkin tertinggal dari kondisi terbaru.`,
    unavailable: "Belum ada sinkronisasi NASA FIRMS yang berhasil tercatat.",
    not_configured:
      "Sinkronisasi NASA FIRMS belum dikonfigurasi di lingkungan ini.",
    configuration_error:
      "Konfigurasi sinkronisasi NASA FIRMS perlu diperiksa. Data peta tetap ditampilkan.",
  } as const;

  return (
    <section
      aria-labelledby="freshness-title"
      className="rounded-2xl border border-peat-forest/10 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-peat-forest" id="freshness-title">
          Status data satelit
        </h2>
        <span className="rounded-full bg-peat-paper px-2.5 py-1 text-[.7rem] font-semibold text-peat-forest">
          {freshness.provider}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-peat-forest/75" role="status">
        {descriptions[freshness.status]}
      </p>
      {freshness.configured ? (
        <p className="mt-2 text-[.7rem] leading-5 text-peat-forest/60">
          {freshness.expectedIntervalMinutes === null
            ? "Interval worker tidak tersedia karena konfigurasi perlu diperbaiki."
            : `Worker dijadwalkan setiap ${freshness.expectedIntervalMinutes} menit.`}
          Penanda ini mengikuti catatan sinkronisasi sukses terakhir.
        </p>
      ) : null}
      <p className="mt-2 text-[.7rem] leading-5 text-peat-forest/60">
        Hotspot satelit adalah indikasi penginderaan jauh, bukan konfirmasi
        kejadian kebakaran. Titik demo selalu ditandai sebagai ilustrasi.
      </p>
    </section>
  );
}
