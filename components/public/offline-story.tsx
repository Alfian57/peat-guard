"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { OfflineReportPreview } from "@/components/public/offline-report-preview";
import { OfflineStoryWord } from "@/components/public/offline-story-word";
import { APP_ROUTES } from "@/lib/routes";
import "./offline-story.css";

const patrolPhoto = "/images/peatland-offline-patrol.webp";

const narrative =
  "Di lapangan, koneksi tidak selalu tersedia. Catat kondisi dan simpan laporan di perangkat. Saat internet kembali, laporan dikirim untuk ditinjau petugas.";
const words = narrative.split(" ");
const titleLead = "Sinyal boleh hilang.".split(" ");
const titleAccent = "Catatan tetap tersimpan.".split(" ");
const titleWordCount = titleLead.length + titleAccent.length;

export function OfflineStory() {
  const trackRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
    trackContentSize: true,
  });
  // Progress stays at zero while the photo scrolls into the full viewport.
  const contentOpacity = useTransform(scrollYProgress, [0.06, 0.18], [0, 1]);
  const titleProgress = useTransform(scrollYProgress, [0.1, 0.34], [0, 1]);
  const narrativeProgress = useTransform(scrollYProgress, [0.38, 0.78], [0, 1]);
  const shadeOpacity = useTransform(
    scrollYProgress,
    [0.02, 0.28],
    [0.24, 0.82],
  );
  const ctaOpacity = useTransform(scrollYProgress, [0.8, 0.87], [0, 1]);
  const ctaPointerEvents = useTransform(scrollYProgress, (value) =>
    value >= 0.8 ? "auto" : "none",
  );

  return (
    <section
      className="offline-story"
      aria-labelledby="offline-story-title"
      ref={trackRef}
    >
      <div className="offline-story__stage">
        <div className="offline-story__backdrop" aria-hidden="true">
          <Image
            src={patrolPhoto}
            alt=""
            className="offline-story__photo"
            fill
            sizes="100vw"
          />
          <motion.div
            className="offline-story__shade"
            style={{ opacity: shadeOpacity }}
          />
        </div>

        <motion.div
          className="offline-story__content"
          style={{ opacity: contentOpacity }}
        >
          <div className="offline-story__copy">
            <p className="offline-story__eyebrow">
              02 / Dari lapangan ke posko
            </p>
            <h2
              id="offline-story-title"
              aria-label="Sinyal boleh hilang. Catatan tetap tersimpan."
            >
              <span aria-hidden="true">
                {titleLead.map((word, index) => (
                  <OfflineStoryWord
                    key={word}
                    word={word}
                    index={index}
                    total={titleWordCount}
                    progress={titleProgress}
                  />
                ))}
              </span>
              <br aria-hidden="true" />
              <span
                className="offline-story__headline-accent"
                aria-hidden="true"
              >
                {titleAccent.map((word, index) => (
                  <OfflineStoryWord
                    key={word}
                    word={word}
                    index={titleLead.length + index}
                    total={titleWordCount}
                    progress={titleProgress}
                  />
                ))}
              </span>
            </h2>
            <p className="sr-only">{narrative}</p>
            <p className="offline-story__narrative" aria-hidden="true">
              {words.map((word, index) => (
                <OfflineStoryWord
                  key={`${index}-${word}`}
                  word={word}
                  index={index}
                  total={words.length}
                  progress={narrativeProgress}
                />
              ))}
            </p>
            <p className="offline-story__preparation">
              Siapkan aplikasi saat terhubung sebelum berangkat patroli.
            </p>
          </div>

          <OfflineReportPreview progress={scrollYProgress} />
        </motion.div>

        <motion.div
          className="offline-story__cta"
          style={{ opacity: ctaOpacity, pointerEvents: ctaPointerEvents }}
        >
          <a href={APP_ROUTES.homeSections.workflow}>
            Kenali alur peninjauan <ArrowRight aria-hidden="true" size={16} />
          </a>
        </motion.div>
        <p className="offline-story__caption">
          Visual ilustratif · bukan dokumentasi patroli.
        </p>
        <div className="offline-story__progress" aria-hidden="true">
          <motion.div style={{ scaleX: scrollYProgress }} />
        </div>
      </div>
    </section>
  );
}
