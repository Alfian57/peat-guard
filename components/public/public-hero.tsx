import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ShieldCheck } from "lucide-react";

export function PublicHero() {
  return (
    <section className="relative isolate overflow-hidden bg-peat-forest text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          alt="Ilustrasi sintetis patroli di kawasan gambut tropis"
          className="object-cover object-center opacity-35"
          fill
          priority
          sizes="100vw"
          src="/images/peatland-patrol-hero.png"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,48,37,.96)_0%,rgba(18,48,37,.82)_48%,rgba(18,48,37,.2)_100%)]" />
      </div>

      <div className="mx-auto grid min-h-[570px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold tracking-[.14em] text-white/90 uppercase">
            <ShieldCheck aria-hidden="true" size={15} />
            Pantauan gambut berbasis komunitas
          </p>
          <h1 className="font-heading text-5xl leading-[.98] font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Jaga gambut.
            <br />
            <span className="text-peat-sun">Cegah karhutla.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
            Pantau zona yang telah disetujui, lihat indikasi titik panas
            satelit, dan pahami dampak perlindungan gambut secara terbuka.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-peat-sun px-6 font-semibold text-peat-forest transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              href="/login"
            >
              Mulai berkontribusi
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/50 px-6 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              href="#peta-publik"
            >
              Lihat peta pantauan
              <ArrowDown aria-hidden="true" size={16} />
            </a>
          </div>
          <p className="mt-5 text-xs leading-5 text-white/65">
            Visual pada halaman ini merupakan ilustrasi sintetis, bukan bukti
            patroli atau kondisi lapangan.
          </p>
        </div>

        <div className="relative hidden min-h-[390px] lg:block">
          <div className="absolute top-4 right-2 h-[360px] w-[min(100%,520px)] overflow-hidden rounded-[2rem] border border-white/25 shadow-2xl shadow-black/20">
            <Image
              alt="Ilustrasi sintetis lanskap gambut dan tim patroli"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 44vw, 0px"
              src="/images/peatland-patrol-mobile.png"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-20">
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                Ilustrasi visual
              </span>
              <p className="mt-3 font-heading text-2xl font-semibold">
                Gambut sehat, komunitas tangguh
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 rounded-2xl border border-white/15 bg-white/95 px-5 py-4 text-peat-forest shadow-xl">
            <p className="text-xs font-semibold tracking-wide text-peat-green uppercase">
              Transparansi publik
            </p>
            <p className="mt-1 text-sm font-medium">
              Zona disetujui · data satelit · estimasi dampak
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
