import Image from "next/image";
import { CheckCircle2, Download, RefreshCw, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { FieldPwaState } from "./use-field-pwa";

const statusLabels = {
  ready: "Siap offline",
  unavailable: "Perlu persiapan",
  development: "Mode pengembangan",
};

export function FieldPwaPanel({ pwa }: { pwa: FieldPwaState }) {
  const descriptions = {
    ready:
      "Aplikasi siap dibuka offline dan dapat menyimpan draf di perangkat ini.",
    unavailable:
      "Persiapan offline belum lengkap. Buka kembali beranda saat terhubung.",
    development:
      "Draf dapat disimpan di perangkat. Pemasangan aplikasi tersedia pada versi produksi melalui HTTPS.",
  };
  const isPreparing = pwa.status === "preparing";

  return (
    <section
      aria-labelledby="field-pwa-title"
      className="min-w-0 overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs"
    >
      <div className="flex items-center gap-3 bg-linear-to-br from-peat-forest via-peat-forest to-peat-green px-4 py-3.5 text-white">
        <Image
          src="/brand/app-icon-192.png"
          alt=""
          width={44}
          height={44}
          unoptimized
          className="size-11 shrink-0 rounded-xl border border-white/20"
        />
        <h2
          id="field-pwa-title"
          className="font-heading text-xl leading-tight font-bold"
        >
          {pwa.installed ? "PEATGUARD terpasang" : "Bawa PEATGUARD ke lapangan"}
        </h2>
      </div>
      <div className="space-y-2 p-3.5">
        {pwa.status === "preparing" ? (
          <div
            className="space-y-2"
            role="status"
            aria-label="Menyiapkan akses offline"
            aria-busy="true"
          >
            <Skeleton
              aria-hidden="true"
              className="h-6 w-28 rounded-full bg-peat-forest/10 motion-reduce:animate-none"
            />
            <Skeleton
              aria-hidden="true"
              className="h-4 w-full max-w-92 bg-peat-forest/10 motion-reduce:animate-none"
            />
          </div>
        ) : (
          <div className="space-y-1.5" role="status">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-peat-paper px-2.5 py-1 text-xs font-semibold text-peat-forest">
              {pwa.status === "ready" ? (
                <CheckCircle2 aria-hidden="true" size={14} />
              ) : (
                <WifiOff aria-hidden="true" size={14} />
              )}
              {statusLabels[pwa.status]}
            </span>
            <p className="text-sm leading-5 text-muted-foreground">
              {descriptions[pwa.status]}
            </p>
          </div>
        )}
        {!pwa.installed && pwa.status !== "development" ? (
          pwa.canInstall || pwa.isInstalling ? (
            <button
              type="button"
              onClick={() => void pwa.install()}
              disabled={pwa.isInstalling}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-peat-forest px-3 text-xs font-semibold text-white hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
            >
              <Download aria-hidden="true" size={16} />
              {pwa.isInstalling ? "Membuka pemasangan…" : "Pasang aplikasi"}
            </button>
          ) : !isPreparing ? (
            <p className="text-xs leading-5 text-muted-foreground">
              {pwa.ios
                ? "Di Safari, buka Bagikan lalu pilih Tambahkan ke Layar Utama."
                : "Buka menu browser lalu pilih Pasang aplikasi atau Tambahkan ke layar utama jika tersedia."}
            </p>
          ) : null
        ) : null}
        {pwa.updateAvailable ? (
          <div className="mt-2 border-t border-peat-forest/10 pt-2">
            <p className="text-xs leading-5 text-muted-foreground">
              Versi baru tersedia. Simpan draf sebelum memuat ulang aplikasi.
            </p>
            <button
              type="button"
              onClick={pwa.update}
              className="mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-peat-green focus-visible:outline-2 focus-visible:outline-peat-green"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Perbarui aplikasi
            </button>
          </div>
        ) : null}
        {pwa.error ? (
          <p className="mt-3 text-sm text-critical" role="alert">
            {pwa.error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
