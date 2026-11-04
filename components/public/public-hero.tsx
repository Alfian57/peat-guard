import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck } from "lucide-react";

import { SiteHeader } from "@/components/public/site-header";

export function PublicHero() {
  return (
    <section className="relative isolate min-h-[min(900px,100svh)] overflow-hidden bg-peat-forest text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          alt="Ilustrasi sintetis patroli berjalan di lanskap gambut tropis"
          className="object-cover object-[58%_center]"
          fill
          priority
          sizes="100vw"
          src="/images/peatland-patrol-hero.png"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,37,29,.92)_0%,rgba(14,37,29,.68)_52%,rgba(14,37,29,.22)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10271f]/65 via-transparent to-[#10271f]/35" />
      </div>

      <SiteHeader />

      <div className="mx-auto flex min-h-[min(900px,100svh)] max-w-7xl items-center px-5 pt-28 pb-16 sm:px-8 sm:pt-32">
        <div className="max-w-3xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold tracking-[.14em] text-white/90 uppercase backdrop-blur-sm">
            <ShieldCheck aria-hidden="true" size={15} />
            Peta terbuka · pantauan berbasis komunitas
          </p>
          <h1 className="font-heading text-5xl leading-[.97] font-bold tracking-tight text-balance sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Menjaga gambut,
            <br />
            <span className="text-peat-sun">menjaga kehidupan.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
            Ikuti zona gambut yang telah disetujui, indikasi titik panas
            satelit, dan upaya perlindungan yang dilakukan bersama komunitas.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-peat-sun px-6 font-semibold text-peat-forest transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              href="/peta"
            >
              <Compass aria-hidden="true" size={18} />
              Lihat peta pantauan
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/55 px-6 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              href="/login"
            >
              Coba sebagai relawan
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>

          <div className="mt-12 flex max-w-2xl flex-col gap-4 border-t border-white/25 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-white/85">
              Bersama relawan desa, posko, dan mitra konservasi.
            </p>
            <p className="text-xs leading-5 text-white/65">
              Foto visual adalah ilustrasi sintetis, bukan bukti patroli.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
