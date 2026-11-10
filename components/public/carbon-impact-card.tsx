import { Leaf } from "lucide-react";
import { APP_ROUTES } from "@/lib/routes";

export function CarbonImpactCard() {
  return (
    <aside className="grid gap-6 rounded-[2rem] bg-peat-forest p-6 text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,.8fr)] lg:items-center lg:p-10">
      <div>
        <p className="text-xs font-bold tracking-[.16em] text-peat-leaf uppercase">
          Dampak terukur
        </p>
        <h3 className="mt-3 font-heading text-3xl leading-none font-bold sm:text-4xl">
          Menjaga lahan, menjaga karbon.
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">
          Estimasi dampak dihitung dari luas zona disetujui dan parameter karbon
          yang aktif. Angka ini bersifat indikatif dan dapat berubah saat data
          diverifikasi.
        </p>
      </div>
      <div className="rounded-2xl border border-white/15 bg-white/8 p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-wide text-peat-leaf uppercase">
          Rumus estimasi
        </p>
        <p className="mt-2 font-mono text-sm leading-6 text-white">
          luas (ha) × B × EF × 3,67
        </p>
        <p className="mt-2 text-xs leading-5 text-white/65">
          Faktor contoh ditandai sebagai ilustrasi dan bukan nilai sertifikasi
          karbon.
        </p>
        <a
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-peat-sun px-5 text-sm font-semibold text-peat-forest hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
          href={APP_ROUTES.homeSections.workflow}
        >
          Pelajari alurnya
          <Leaf aria-hidden="true" size={16} />
        </a>
      </div>
    </aside>
  );
}
