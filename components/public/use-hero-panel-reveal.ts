"use client";

import {
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { FocusEvent, RefObject } from "react";

// Stretch the response by 2×, preserving damping and softening initial acceleration.
const HERO_PANEL_TIME_SCALE = 2;

export const HERO_PANEL_SPRING = {
  stiffness: 320 / HERO_PANEL_TIME_SCALE ** 2,
  damping: 40 / HERO_PANEL_TIME_SCALE,
  mass: 1,
  restDelta: 0.0001,
  restSpeed: 0.001 / HERO_PANEL_TIME_SCALE,
};

export function revealHeroPanelForKeyboard(
  target: EventTarget,
  marker: HTMLDivElement | null,
  progress: MotionValue<number>,
) {
  if (
    !marker ||
    !(target instanceof HTMLElement) ||
    !target.matches(":focus-visible")
  ) {
    return;
  }

  // The marker never scales, so focus cannot change the scroll destination.
  const top = marker.getBoundingClientRect().bottom + window.scrollY;
  window.scrollTo({ top, behavior: "instant" });
  progress.jump(1);
}

export function useHeroPanelReveal(
  markerRef: RefObject<HTMLDivElement | null>,
) {
  const { scrollYProgress } = useScroll({
    target: markerRef,
    offset: ["start start", "end start"],
    trackContentSize: true,
  });
  const progress = useSpring(scrollYProgress, HERO_PANEL_SPRING);
  // Reveal finishes around ~58% of the scroll track; the remaining ~42% holds the section pinned full screen.
  const y = useTransform(progress, [0, 0.58, 1], ["100%", "0%", "0%"], {
    clamp: true,
  });
  const scale = useTransform(progress, [0, 0.58, 1], [0.38, 1, 1], {
    clamp: true,
  });
  const borderRadius = useTransform(
    progress,
    [0, 0.48, 0.58, 1],
    [48, 36, 0, 0],
    {
      clamp: true,
    },
  );

  function onFocusCapture(event: FocusEvent<HTMLDivElement>) {
    revealHeroPanelForKeyboard(event.target, markerRef.current, progress);
  }

  return { y, scale, borderRadius, onFocusCapture };
}
