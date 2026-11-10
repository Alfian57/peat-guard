import Image from "next/image";
import { ArrowDown, ClipboardCheck, Eye, Waves } from "lucide-react";

import { APP_ROUTES } from "@/lib/routes";

const storySteps = [
  {
    icon: <Eye aria-hidden="true" size={19} />,
    number: "01",
    title: "Amati",
    description:
      "Zona gambut dan indikasi satelit memberi konteks untuk pemantauan.",
  },
  {
    icon: <ClipboardCheck aria-hidden="true" size={19} />,
    number: "02",
    title: "Tinjau",
    description:
      "Petugas memeriksa laporan lapangan sebelum tindak lanjut dilakukan.",
  },
  {
    icon: <Waves aria-hidden="true" size={19} />,
    number: "03",
    title: "Bagikan",
    description: "Publik melihat informasi yang sudah disetujui untuk dibuka.",
  },
];

export function PeatlandStory() {
  return (
    <section
      aria-labelledby="cerita-gambut-title"
      className="peatland-story relative isolate bg-peat-forest text-white"
      id="cerita-gambut"
    >
      <div className="peatland-story__stage sticky top-0 flex min-h-[100svh] items-center overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="peatland-story__image-layer absolute -inset-[4%]">
            <Image
              alt=""
              className="object-cover object-center"
              fill
              sizes="100vw"
              src="/images/peatland-parallax-panorama.webp"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,35,25,.94)_0%,rgba(11,35,25,.83)_42%,rgba(11,35,25,.4)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b2119]/80 via-transparent to-[#0b2119]/20" />
        </div>

        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 pt-36 pb-20 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-14 lg:pt-32">
          <div className="peatland-story__copy max-w-2xl">
            <h2
              className="peatland-story__title font-heading text-4xl leading-[.98] font-bold text-balance sm:text-6xl lg:text-7xl"
              id="cerita-gambut-title"
            >
              Kondisi air ikut menentukan risiko kebakaran gambut.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Gambut menyimpan air dan karbon. Saat mengering, lapisan gambut
              lebih rentan terbakar. Pantauan membantu petugas membaca konteks
              dan menindaklanjuti laporan lapangan.
            </p>
            <a
              className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-peat-sun transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              href={APP_ROUTES.homeSections.publicMap}
            >
              Lihat informasi pantauan
              <ArrowDown aria-hidden="true" size={16} />
            </a>
          </div>

          <div className="peatland-story__workflow relative">
            <div className="rounded-[1.75rem] border border-white/20 bg-[#10291f]/75 p-4 shadow-2xl backdrop-blur-md sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/15 pb-4">
                <p className="text-xs font-bold tracking-[.16em] text-white/75 uppercase">
                  Dari pantauan ke perlindungan
                </p>
                <span className="rounded-full bg-peat-leaf/20 px-3 py-1 text-[11px] font-semibold text-peat-leaf">
                  Alur PEATGUARD
                </span>
              </div>
              <ol className="divide-y divide-white/15">
                {storySteps.map((step) => (
                  <li
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                    key={step.number}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-peat-leaf/15 text-peat-leaf">
                      {step.icon}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold tracking-[.14em] text-peat-leaf uppercase">
                        {step.number} · {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/80">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-3 text-right text-xs text-white/65">
              Visual ilustratif · bukan dokumentasi lokasi operasional.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
