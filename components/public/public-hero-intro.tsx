"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { RefObject } from "react";

import { useHeroPanelReveal } from "@/components/public/use-hero-panel-reveal";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { handleSectionScroll } from "@/components/public/smooth-scroll";
import { APP_ROUTES } from "@/lib/routes";

const peatlandIntro = "/images/peatland-arsip-bumi.webp";

interface PublicHeroIntroProps {
  revealMarkerRef: RefObject<HTMLDivElement | null>;
  prefersReducedMotion: boolean;
}

export function PublicHeroIntro({
  revealMarkerRef,
  prefersReducedMotion,
}: PublicHeroIntroProps) {
  const { y, scale, borderRadius, onFocusCapture } =
    useHeroPanelReveal(revealMarkerRef);

  return (
    <motion.div
      className="public-hero__panel relative isolate z-10 text-peat-forest"
      initial={false}
      onFocusCapture={prefersReducedMotion ? undefined : onFocusCapture}
      style={{
        transformOrigin: "50% 100%",
        y,
        scale,
        borderRadius,
        willChange: prefersReducedMotion ? undefined : "transform",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 overflow-hidden"
      >
        <Image
          alt=""
          className="public-hero__art"
          fill
          sizes="100vw"
          src={peatlandIntro}
        />
        <div className="public-hero__intro-backdrop absolute inset-0" />
      </div>

      <div className="public-hero__intro-layout mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-14">
        <div className="public-hero__copy">
          <h1
            className="public-hero__title font-heading font-bold tracking-tight text-balance"
            id="hero-title"
          >
            Pantau lebih awal.
            <span className="block text-peat-green">
              Lindungi bentang gambut.
            </span>
          </h1>
          <p className="public-hero__description text-peat-forest/85">
            Platform <strong className="font-semibold">PEATGUARD</strong>{" "}
            berbasis sistem{" "}
            <span className="font-semibold">
              Peatland Early-Warning & Audit Tracking (PEAT)
            </span>{" "}
            yang menyatukan deteksi dini hotspot satelit, pelaporan patroli
            lapangan relawan, serta transparansi audit karbon dalam satu peta
            terbuka.
          </p>

          <div className="public-hero__actions flex flex-col flex-wrap gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-peat-forest px-6 text-sm font-semibold text-white transition-colors hover:bg-peat-forest/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-forest"
              href={APP_ROUTES.publicMap}
            >
              Buka peta pantauan
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-peat-forest/30 bg-peat-paper/60 px-6 text-sm font-semibold text-peat-forest transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-forest"
              href={APP_ROUTES.homeSections.workflow}
              onClick={(e) =>
                handleSectionScroll(e, APP_ROUTES.homeSections.workflow)
              }
            >
              Kenali cara kerjanya
              <ArrowDown aria-hidden="true" size={16} />
            </a>
            {prefersReducedMotion ? (
              <PwaInstallButton className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-peat-forest/25 bg-white px-5 text-sm font-semibold text-peat-forest transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-forest disabled:opacity-60 lg:hidden" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="public-hero__intro-footer absolute inset-x-0 bottom-0 flex items-end px-5 pb-5 sm:px-8 lg:px-14">
        <p className="rounded-full bg-peat-paper/90 px-3 py-2 text-[10px] text-peat-forest/80 sm:text-xs">
          Visual ilustratif
          <span className="hidden sm:inline"> · bukan bukti pantauan</span>
        </p>
      </div>
    </motion.div>
  );
}
