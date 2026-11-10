import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Satellite,
  ShieldCheck,
} from "lucide-react";

import { APP_ROUTES } from "@/lib/routes";

const steps = [
  {
    icon: <ClipboardList aria-hidden="true" size={21} />,
    number: "01",
    title: "Catat kondisi lapangan",
    description:
      "Relawan mengirim pengamatan patroli, termasuk kondisi asap dan infrastruktur air.",
  },
  {
    icon: <Satellite aria-hidden="true" size={21} />,
    number: "02",
    title: "Tinjau konteks dan laporan",
    description:
      "Petugas menelaah laporan bersama batas zona gambut dan indikasi hotspot satelit.",
  },
  {
    icon: <ShieldCheck aria-hidden="true" size={21} />,
    number: "03",
    title: "Bagikan informasi terpilih",
    description:
      "Peta publik menampilkan zona yang disetujui dan data yang layak dibuka.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="cara-kerja-title"
      className="public-how-it-works bg-peat-paper py-20 sm:py-24"
      id="cara-kerja"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
        <div className="grid gap-8 border-b border-peat-forest/15 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="public-scroll-reveal max-w-3xl">
            <p className="text-xs font-bold tracking-[.18em] text-peat-green uppercase">
              Kerja lapangan · tinjauan · informasi publik
            </p>
            <h2
              className="mt-4 font-heading text-4xl leading-[.98] font-bold text-balance text-peat-forest sm:text-6xl"
              id="cara-kerja-title"
            >
              Setiap informasi punya jalur yang jelas.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-peat-forest/75">
              Pemantauan menghubungkan pengamatan relawan dengan peninjauan
              petugas, lalu membuka hanya informasi yang sudah disetujui.
            </p>
          </div>
          <p className="flex items-center gap-2 self-start rounded-full border border-peat-forest/15 bg-white px-4 py-2.5 text-xs font-semibold text-peat-forest/75 lg:self-auto">
            <CheckCircle2
              aria-hidden="true"
              className="text-peat-green"
              size={16}
            />
            Laporan warga tidak menjadi pin di peta publik
          </p>
        </div>

        <div
          aria-hidden="true"
          className="public-workflow__rail mx-auto mt-10 hidden w-[72%] md:grid"
        >
          <span className="public-workflow__rail-dot" />
          <span className="public-workflow__rail-dot" />
          <span className="public-workflow__rail-dot" />
          <span className="public-workflow__rail-track">
            <span className="public-workflow__rail-fill" />
          </span>
        </div>

        <ol className="public-workflow__steps mt-4 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <li className="public-workflow__step" key={step.number}>
              <article className="public-workflow__card flex h-full flex-col rounded-[1.5rem] border border-peat-forest/10 bg-white p-6 shadow-[0_12px_36px_rgba(31,77,61,.06)] sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-peat-forest text-peat-sun">
                    {step.icon}
                  </span>
                  <span className="font-mono text-sm font-semibold tracking-wider text-peat-forest/45">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-8 font-heading text-3xl leading-none font-bold text-peat-forest">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-peat-forest/70">
                  {step.description}
                </p>
              </article>
            </li>
          ))}
        </ol>

        <div className="public-workflow__cta mt-10 flex flex-col justify-between gap-6 rounded-[1.75rem] bg-peat-forest p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[.16em] text-peat-leaf uppercase">
              Untuk publik dan mitra
            </p>
            <h3 className="mt-3 font-heading text-3xl leading-tight font-bold text-balance sm:text-4xl">
              Baca data yang terbuka. Dukung perlindungan yang terarah.
            </h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-peat-sun px-5 text-sm font-semibold text-peat-forest transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
              href={APP_ROUTES.publicMap}
            >
              Jelajahi peta
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
              href={APP_ROUTES.login}
            >
              Masuk ke PEATGUARD
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
