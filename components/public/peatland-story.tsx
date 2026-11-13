"use client";

import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { PeatlandStorySteps } from "@/components/public/peatland-story-steps";
import { handleSectionScroll } from "@/components/public/smooth-scroll";
import { APP_ROUTES } from "@/lib/routes";
import "./peatland-story.css";

const peatlandForeground = "/images/peatland-foreground-v2.webp";

export function PeatlandStory() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
    trackContentSize: true,
  });
  // One reversible progress drives both layers. The final 10% holds the scene.
  const progress = useTransform(scrollYProgress, (value) => {
    const phase = Math.max(0, Math.min(1, value / 0.9));
    return phase * phase * (3 - 2 * phase);
  });
  const titleScale = useTransform(progress, [0, 1], [1, 2.15]);
  const titleColor = useTransform(progress, [0, 1], ["#1f4d3d", "#8b9e90"]);
  const landscapeY = useTransform(progress, [0, 1], ["110%", "0%"]);
  const landscapeOpacity = useTransform(progress, [0, 0.2], [0, 1]);

  return (
    <section
      aria-labelledby="cerita-gambut-title"
      className="peatland-story"
      id="cerita-gambut"
    >
      <div className="peatland-scene" ref={trackRef}>
        <div className="peatland-scene__stage">
          <div className="peatland-scene__layout">
            <header className="peatland-scene__header">
              <div className="peatland-scene__eyebrow">
                <span>01 / Mengenal gambut</span>
                <span>Air · tanah · kehidupan</span>
              </div>
              <div className="peatland-scene__introduction">
                <h2 id="cerita-gambut-title">
                  Kondisi air ikut menentukan risiko kebakaran gambut.
                </h2>
                <div className="peatland-scene__copy">
                  <p>
                    Gambut menyimpan air dan karbon. Saat mengering, lapisan
                    gambut lebih rentan terbakar. Pantauan membantu petugas
                    membaca konteks dan menindaklanjuti laporan lapangan.
                  </p>
                  <a
                    href={APP_ROUTES.homeSections.publicMap}
                    onClick={(event) =>
                      handleSectionScroll(
                        event,
                        APP_ROUTES.homeSections.publicMap,
                      )
                    }
                  >
                    Lihat informasi pantauan
                    <ArrowDown aria-hidden="true" size={15} />
                  </a>
                </div>
              </div>
            </header>

            <div aria-hidden="true" className="peatland-scene__visual">
              <motion.div
                className="peatland-scene__word"
                style={{ scale: titleScale, color: titleColor }}
              >
                Gambut.
              </motion.div>
            </div>
          </div>
          <motion.div
            aria-hidden="true"
            className="peatland-scene__landscape"
            style={{ y: landscapeY, opacity: landscapeOpacity }}
          >
            <Image
              alt=""
              className="peatland-scene__image"
              src={peatlandForeground}
              fill
              sizes="96vw"
              loading="eager"
            />
          </motion.div>
          <p className="peatland-scene__caption">
            Visual ilustratif · bukan dokumentasi lokasi operasional.
          </p>
        </div>
      </div>
      <PeatlandStorySteps />
    </section>
  );
}
