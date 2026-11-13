"use client";

import { motion } from "motion/react";

import { sectionReveal } from "@/components/public/public-section-motion";

import "./peatland-story-steps.css";

const steps = [
  {
    number: "01",
    title: "Amati",
    lead: "Mulai dari konteks bentangnya.",
    description:
      "Zona gambut dan indikasi hotspot satelit membantu memahami area yang perlu mendapat perhatian.",
    context: "Batas zona gambut · Indikasi hotspot satelit",
  },
  {
    number: "02",
    title: "Tinjau",
    lead: "Telaah sebelum menindaklanjuti.",
    description:
      "Laporan lapangan ditinjau bersama konteks wilayah. Hotspot adalah indikasi satelit, bukan konfirmasi kejadian kebakaran.",
    context: "Pengamatan lapangan · Konteks wilayah",
  },
  {
    number: "03",
    title: "Bagikan",
    lead: "Buka informasi yang layak dibagikan.",
    description:
      "Informasi yang telah disetujui ditampilkan pada peta publik agar dapat dipahami dan ditelusuri.",
    context: "Zona disetujui · Data yang layak dibuka",
  },
];

export function PeatlandStorySteps() {
  return (
    <section
      className="peatland-story-steps"
      aria-labelledby="peatland-story-steps-title"
    >
      <div className="peatland-story-steps__inner">
        <div className="peatland-story-steps__heading">
          <div>
            <p className="peatland-story-steps__eyebrow">
              Dari pantauan ke perlindungan
            </p>
            <h3 id="peatland-story-steps-title">
              Pahami bentangnya.
              <br />
              Baca informasinya.
            </h3>
          </div>
          <p className="peatland-story-steps__introduction">
            Informasi memberi konteks. Peninjauan membantu menentukan apa yang
            perlu ditindaklanjuti dan layak dibuka.
          </p>
        </div>
        <motion.ol
          className="peatland-story-steps__rows"
          initial="rest"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            rest: {},
            visible: { transition: { staggerChildren: 0.14 } },
          }}
        >
          {steps.map((step) => (
            <motion.li
              className="peatland-story-steps__row"
              key={step.number}
              variants={sectionReveal}
            >
              <span className="peatland-story-steps__number" aria-hidden="true">
                {step.number}
              </span>
              <h4>{step.title}</h4>
              <div className="peatland-story-steps__copy">
                <p className="peatland-story-steps__lead">{step.lead}</p>
                <p className="peatland-story-steps__description">
                  {step.description}
                </p>
                <p className="peatland-story-steps__context">{step.context}</p>
              </div>
              <motion.span
                aria-hidden="true"
                className="peatland-story-steps__line"
                variants={{
                  rest: { scaleX: 0 },
                  visible: {
                    scaleX: 1,
                    transition: { duration: 1.2, ease: [0.32, 0, 0.2, 1] },
                  },
                }}
              />
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
