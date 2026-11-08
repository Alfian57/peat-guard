import Image from "next/image";
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
    icon: <ClipboardList aria-hidden="true" size={20} />,
    number: "01",
    title: "Catat kondisi lapangan",
    description:
      "Relawan mengirim pengamatan patroli, termasuk kondisi asap dan infrastruktur air.",
  },
  {
    icon: <Satellite aria-hidden="true" size={20} />,
    number: "02",
    title: "Tinjau indikasi dan zona",
    description:
      "Petugas memeriksa laporan bersama data hotspot satelit dan batas zona gambut.",
  },
  {
    icon: <ShieldCheck aria-hidden="true" size={20} />,
    number: "03",
    title: "Bagikan dampak terverifikasi",
    description:
      "Publik melihat zona yang disetujui serta estimasi dampak berbasis luas dan parameter karbon.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="cara-kerja-title"
      className="bg-white py-16 sm:py-20"
      id="cara-kerja"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <div className="relative min-h-[340px] overflow-hidden rounded-3xl bg-peat-forest sm:min-h-[440px]">
            <Image
              alt="Ilustrasi sintetis warga menjaga pintu air di kawasan gambut"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              src="/images/community-water-gate.png"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent p-6 pt-28 text-white sm:p-8 sm:pt-32">
              <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                Ilustrasi visual sintetis
              </span>
              <p className="mt-3 max-w-md font-heading text-3xl leading-tight font-bold sm:text-4xl">
                Upaya penjagaan gambut dimulai dari komunitas.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold tracking-[.16em] text-peat-green uppercase">
              Dari pengamatan ke perlindungan
            </p>
            <h2
              className="mt-3 font-heading text-4xl leading-none font-bold text-peat-forest sm:text-5xl"
              id="cara-kerja-title"
            >
              Setiap langkah punya konteks.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-peat-forest/75">
              Peta publik menampilkan informasi yang sudah layak dibagikan.
              Detail laporan dan identitas pelapor tetap berada di alur kerja
              petugas yang berwenang.
            </p>

            <ol className="mt-8 space-y-6">
              {steps.map((step) => (
                <li className="flex gap-4" key={step.number}>
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-peat-forest text-peat-paper">
                    {step.icon}
                  </span>
                  <div className="pt-0.5">
                    <p className="text-xs font-bold tracking-wider text-peat-green uppercase">
                      Langkah {step.number}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-peat-forest">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-peat-forest/70">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-peat-forest px-6 text-sm font-semibold text-white hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-peat-green"
              href={APP_ROUTES.login}
            >
              Masuk ke PEATGUARD
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-peat-forest/60">
              <CheckCircle2 aria-hidden="true" size={15} />
              Data patroli tidak dipublikasikan sebagai pin pada peta terbuka.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
