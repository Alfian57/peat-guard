"use client";

import Image from "next/image";
import { ArrowDown, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PublicHeroHeadline } from "@/components/public/public-hero-headline";
import { PublicHeroIntro } from "@/components/public/public-hero-intro";
import { handleSectionScroll } from "@/components/public/smooth-scroll";
import { APP_ROUTES } from "@/lib/routes";
import "./public-hero.css";

const HERO_VIDEO_PATH = "/videos/peatland-hero.mp4";
const HERO_POSTER_PATH = "/images/peatland-hero-poster.png";

type NetworkPreference = EventTarget & {
  effectiveType?: string;
  saveData?: boolean;
};

export function PublicHero() {
  const videoWindowRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [conserveData, setConserveData] = useState(true);
  const playbackPreference = useRef<"play" | "pause" | null>(null);
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
    const { connection } = navigator as Navigator & {
      connection?: NetworkPreference;
    };
    const update = () =>
      setConserveData(
        Boolean(connection?.saveData) ||
          ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? ""),
      );
    update();
    connection?.addEventListener("change", update);
    return () => connection?.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const videoWindow = videoWindowRef.current;

    if (!videoWindow || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.01 },
    );

    observer.observe(videoWindow);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (
      !isInView ||
      videoUnavailable ||
      playbackPreference.current === "pause" ||
      (playbackPreference.current !== "play" &&
        (prefersReducedMotion || conserveData))
    ) {
      video.pause();
      return;
    }

    void video.play().catch(() => setIsPlaying(false));
  }, [conserveData, isInView, prefersReducedMotion, videoUnavailable]);

  async function togglePlayback() {
    const video = videoRef.current;

    if (!video || videoUnavailable) {
      return;
    }

    if (video.paused) {
      playbackPreference.current = "play";
      await video.play().catch(() => setIsPlaying(false));
      return;
    }

    playbackPreference.current = "pause";
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
      className="public-hero relative isolate bg-peat-forest text-white"
      id="hero"
    >
      <div
        aria-hidden="true"
        className="public-hero__video-window pointer-events-none absolute inset-x-0 top-0"
        ref={videoWindowRef}
      />
      <div className="public-hero__stage sticky top-0 isolate overflow-hidden bg-peat-forest">
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
        <PublicHeroHeadline
          markerRef={videoWindowRef}
          prefersReducedMotion={prefersReducedMotion}
        />
        <div className="public-hero__controls pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 px-5 pb-5 sm:px-8 lg:px-14">
          <div className="public-hero__video-controls pointer-events-auto flex min-w-0 shrink-0 items-center gap-2 rounded-full border border-white/20 bg-black/20 px-2 py-2 text-xs text-white/90 backdrop-blur-sm md:gap-3 md:px-3">
            <span className="hidden md:inline">
              Visual ilustratif · bukan bukti pantauan
            </span>
            <span className="md:hidden">Ilustratif</span>
            {!videoUnavailable ? (
              <>
                <span aria-hidden="true" className="h-4 w-px bg-white/25" />
                <button
                  aria-label={
                    isPlaying ? "Jeda video latar" : "Putar video latar"
                  }
                  className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white/15 px-2.5 text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  onClick={togglePlayback}
                  type="button"
                >
                  {isPlaying ? (
                    <Pause aria-hidden="true" fill="currentColor" size={15} />
                  ) : (
                    <>
                      <Play aria-hidden="true" fill="currentColor" size={15} />
                      {conserveData ? <span>Putar</span> : null}
                    </>
                  )}
                </button>
                <button
                  aria-label={
                    isMuted ? "Aktifkan suara video" : "Matikan suara video"
                  }
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
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
            onClick={(e) =>
              handleSectionScroll(e, APP_ROUTES.homeSections.peatlandStory)
            }
          >
            <span className="hidden md:inline">
              Gulir untuk mengenal gambut
            </span>
            <span className="md:hidden">Gulir</span>
            <ArrowDown aria-hidden="true" size={15} />
          </a>
        </div>
      </div>
      <div className="public-hero__intro-track">
        <div className="public-hero__intro-stage">
          <PublicHeroIntro
            prefersReducedMotion={prefersReducedMotion}
            revealMarkerRef={videoWindowRef}
          />
        </div>
      </div>
    </section>
  );
}
