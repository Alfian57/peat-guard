"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Satellite,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";

import { PublicSection } from "@/components/public/public-section";
import { sectionReveal } from "@/components/public/public-section-motion";
import { APP_ROUTES } from "@/lib/routes";

const steps = [
  {
    icon: <ClipboardList aria-hidden="true" size={22} strokeWidth={1.4} />,
    number: "01",
    title: "Catat kondisi lapangan",
    description:
      "Relawan mengirim pengamatan patroli, termasuk kondisi asap dan infrastruktur air.",
  },
  {
    icon: <Satellite aria-hidden="true" size={22} strokeWidth={1.4} />,
    number: "02",
    title: "Tinjau konteks dan laporan",
    description:
      "Petugas menelaah laporan bersama batas zona gambut dan indikasi hotspot satelit.",
  },
  {
    icon: <ShieldCheck aria-hidden="true" size={22} strokeWidth={1.4} />,
    number: "03",
    title: "Bagikan informasi terpilih",
    description:
      "Peta publik menampilkan zona yang disetujui dan data yang layak dibuka.",
  },
];

export function HowItWorks() {
  return (
    <PublicSection
      id="cara-kerja"
      labelledBy="cara-kerja-title"
      className="public-how-it-works"
    >
      <div className="public-section__inner public-workflow__layout">
        <motion.div
          className="public-section__reveal public-section__eyebrow"
          variants={sectionReveal}
        >
          <span>05 / Dari informasi ke tindakan</span>
          <span>Saling terhubung</span>
        </motion.div>

        <motion.div
          className="public-section__reveal public-workflow__heading"
          variants={sectionReveal}
        >
          <h2 className="public-section__title" id="cara-kerja-title">
            Setiap informasi punya <span>jalur yang jelas.</span>
          </h2>
          <p className="public-section__description">
            Pemantauan menghubungkan pengamatan relawan dengan peninjauan
            petugas, lalu membuka hanya informasi yang sudah disetujui.
          </p>
        </motion.div>

        <ol className="public-workflow__steps">
          {steps.map((step) => (
            <motion.li
              className="public-section__reveal public-workflow__step"
              key={step.number}
              variants={sectionReveal}
            >
              <div className="public-workflow__marker">
                <span className="public-workflow__number">{step.number}</span>
                <span className="public-workflow__icon">{step.icon}</span>
              </div>
              <div className="public-workflow__step-copy">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <motion.div
          className="public-section__reveal public-workflow__footer"
          variants={sectionReveal}
        >
          <div>
            <p className="public-workflow__assurance">
              <CheckCircle2 aria-hidden="true" size={16} />
              Laporan warga tidak menjadi pin di peta publik
            </p>
            <p className="public-workflow__invitation">
              Baca data yang terbuka. Dukung perlindungan yang terarah.
            </p>
          </div>
          <div className="public-workflow__actions">
            <Link
              className="public-section__button"
              href={APP_ROUTES.publicMap}
            >
              Jelajahi peta <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link className="public-section__text-link" href={APP_ROUTES.login}>
              Masuk ke PEATGUARD <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </PublicSection>
  );
}
