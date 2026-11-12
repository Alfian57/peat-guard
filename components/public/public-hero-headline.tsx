"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import type { RefObject } from "react";

import { HERO_PANEL_SPRING } from "@/components/public/use-hero-panel-reveal";

interface PublicHeroHeadlineProps {
  markerRef: RefObject<HTMLDivElement | null>;
  prefersReducedMotion: boolean;
}

export function PublicHeroHeadline({
  markerRef,
  prefersReducedMotion,
}: PublicHeroHeadlineProps) {
  const { scrollYProgress } = useScroll({
    target: markerRef,
    offset: ["start start", "end start"],
    trackContentSize: true,
  });

  const progress = useSpring(scrollYProgress, HERO_PANEL_SPRING);

  // Fade out and gently drift up as the user scrolls and the panel rises.
  const opacity = useTransform(progress, [0, 0.2], [1, 0], {
    clamp: true,
  });
  const y = useTransform(progress, [0, 0.2], [0, -36], {
    clamp: true,
  });
  const scale = useTransform(progress, [0, 0.2], [1, 0.95], {
    clamp: true,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5 pt-16 pb-24 text-center sm:px-8"
      style={
        prefersReducedMotion
          ? undefined
          : {
              opacity,
              y,
              scale,
              willChange: "transform, opacity",
            }
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        <h2 className="font-heading text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
          Bentang Gambut <span className="text-peat-sun">Indonesia.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed font-normal text-white/85 sm:text-xl lg:text-2xl">
          Penjaga iklim global, benteng keanekaragaman hayati, dan arsip purba
          bumi.
        </p>
      </div>
    </motion.div>
  );
}
