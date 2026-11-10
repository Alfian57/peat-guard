"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { APP_ROUTES } from "@/lib/routes";

const HERO_VIDEO_PATH = "/videos/peatland-hero.mp4";
const HERO_POSTER_PATH = "/images/peatland-hero-poster.png";

export function PublicHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(preference.matches);

    updatePreference();
    preference.addEventListener("change", updatePreference);

    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.01 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (prefersReducedMotion || !isInView || videoUnavailable) {
      video.pause();
      return;
    }

    void video.play().catch(() => setIsPlaying(false));
  }, [isInView, prefersReducedMotion, videoUnavailable]);

  async function togglePlayback() {
    const video = videoRef.current;

    if (!video || videoUnavailable) {
      return;
    }

    if (video.paused) {
      await video.play().catch(() => setIsPlaying(false));
      return;
    }

    video.pause();
  }

  function toggleMuted() {
    const video = videoRef.current;

    if (!video || videoUnavailable) {
      return;
    }

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  }

  return (
    <section
      aria-labelledby="hero-title"
      className="public-hero relative isolate min-h-[200svh] bg-peat-forest text-white"
      id="hero"
      ref={sectionRef}
    >
      <div className="public-hero__stage sticky top-0 isolate h-svh overflow-hidden bg-peat-forest">
        <div
          aria-hidden="true"
          className="public-hero__media absolute inset-0 -z-10 overflow-hidden"
        >
          <Image
            alt=""
            className="object-cover object-[57%_center]"
            fill
            loading="eager"
            sizes="100vw"
            src={HERO_POSTER_PATH}
          />
          <video
            aria-hidden="true"
            className={`absolute inset-0 size-full object-cover object-[57%_center] transition-opacity duration-700 ${isPlaying ? "opacity-100" : "opacity-0"}`}
            loop
            muted={isMuted}
            onError={() => setVideoUnavailable(true)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            playsInline
            poster={HERO_POSTER_PATH}
            preload="none"
            ref={videoRef}
            src={HERO_VIDEO_PATH}
          />
        </div>
        <div className="public-hero__shade pointer-events-none absolute inset-0 z-0 bg-black opacity-[.22]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(12,34,25,.50)_0%,rgba(12,34,25,.24)_48%,rgba(12,34,25,.08)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-[#0b2119]/70 via-transparent to-[#0b2119]/45"
        />
        <div
          aria-hidden="true"
          className="public-hero__panel pointer-events-none absolute inset-0 z-[1]"
        />

        <div className="public-hero__copy absolute inset-0 z-10 flex items-center justify-center px-5 pt-48 pb-24 text-center sm:px-8 lg:pt-20">
          <div className="mx-auto max-w-4xl">
            <h1
              className="font-heading text-5xl leading-[.95] font-bold tracking-tight text-balance sm:text-7xl lg:text-[6.5rem]"
              id="hero-title"
            >
              Pantau lebih awal.
              <br />
              <span className="text-peat-sun">Lindungi bentang gambut.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
              Platform{" "}
              <strong className="font-semibold text-white">PEATGUARD</strong>{" "}
              berbasis sistem{" "}
              <span className="font-medium text-peat-sun">
                Peatland Early-Warning & Audit Tracking (PEAT)
              </span>{" "}
              yang menyatukan deteksi dini hotspot satelit, pelaporan patroli
              lapangan relawan, serta transparansi audit karbon dalam satu peta
              terbuka.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-peat-sun px-6 font-semibold text-peat-forest transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                href={APP_ROUTES.publicMap}
              >
                Buka peta pantauan
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                href={APP_ROUTES.homeSections.workflow}
              >
                Kenali cara kerjanya
                <ArrowDown aria-hidden="true" size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="public-hero__controls pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 px-5 pb-5 sm:px-8 lg:px-14">
          <div className="public-hero__video-controls pointer-events-auto flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-black/20 px-2 py-2 text-xs text-white/90 backdrop-blur-sm md:gap-3 md:px-3">
            <span className="hidden md:inline">
              Visual ilustratif · bukan bukti pantauan
            </span>
            <span className="md:hidden">Ilustratif · bukan bukti</span>
            {!videoUnavailable ? (
              <>
                <span aria-hidden="true" className="h-4 w-px bg-white/25" />
                <button
                  aria-label={
                    isPlaying ? "Jeda video latar" : "Putar video latar"
                  }
                  className="grid aspect-square size-9 min-h-0 min-w-0 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={togglePlayback}
                  type="button"
                >
                  {isPlaying ? (
                    <Pause aria-hidden="true" fill="currentColor" size={15} />
                  ) : (
                    <Play aria-hidden="true" fill="currentColor" size={15} />
                  )}
                </button>
                <button
                  aria-label={
                    isMuted ? "Aktifkan suara video" : "Matikan suara video"
                  }
                  className="grid aspect-square size-9 min-h-0 min-w-0 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                  onClick={toggleMuted}
                  type="button"
                >
                  {isMuted ? (
                    <VolumeX aria-hidden="true" size={15} />
                  ) : (
                    <Volume2 aria-hidden="true" size={15} />
                  )}
                </button>
              </>
            ) : null}
          </div>

          <a
            className="public-hero__scroll-prompt pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-bold tracking-[.18em] text-white/90 uppercase transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href={APP_ROUTES.homeSections.peatlandStory}
          >
            <span className="hidden md:inline">
              Gulir untuk mengenal gambut
            </span>
            <span className="md:hidden">Gulir</span>
            <ArrowDown aria-hidden="true" size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
