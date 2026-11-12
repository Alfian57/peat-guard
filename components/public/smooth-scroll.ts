import type { MouseEvent } from "react";

let activeAnimationId: number | null = null;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Animated smooth scroll using requestAnimationFrame with an easeInOutCubic curve.
 * Provides a consistent, silky glide across all browsers without native jumpiness.
 */
export function smoothScrollTo(targetY: number, duration = 750): Promise<void> {
  return new Promise((resolve) => {
    if (activeAnimationId !== null) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
    }

    const startY = window.scrollY;
    const distance = targetY - startY;

    if (Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      resolve();
      return;
    }

    let startTime: number | null = null;

    const cancelOnUserInteraction = () => {
      if (activeAnimationId !== null) {
        cancelAnimationFrame(activeAnimationId);
        activeAnimationId = null;
      }
      cleanup();
      resolve();
    };

    const cleanup = () => {
      window.removeEventListener("wheel", cancelOnUserInteraction);
      window.removeEventListener("touchmove", cancelOnUserInteraction);
    };

    window.addEventListener("wheel", cancelOnUserInteraction, {
      passive: true,
    });
    window.addEventListener("touchmove", cancelOnUserInteraction, {
      passive: true,
    });

    function step(currentTime: number) {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * ease);

      if (progress < 1) {
        activeAnimationId = requestAnimationFrame(step);
      } else {
        activeAnimationId = null;
        cleanup();
        resolve();
      }
    }

    activeAnimationId = requestAnimationFrame(step);
  });
}

/**
 * Smoothly scrolls to a section on the landing page, compensating for the fixed header
 * height and respecting user motion preferences.
 */
export function handleSectionScroll(
  event: MouseEvent<HTMLAnchorElement>,
  targetHash: string,
) {
  const targetId = targetHash.replace(/^#/, "");

  if (!targetId) {
    return;
  }

  const targetElement = document.getElementById(targetId);

  // If target element is not on the current page, let native link navigation proceed
  if (!targetElement) {
    return;
  }

  event.preventDefault();

  if (targetId === "hero") {
    smoothScrollTo(0, 700);

    if (window.location.hash) {
      history.pushState(null, "", window.location.pathname);
    }
    return;
  }

  // Calculate header height dynamically (including mobile subnav if present)
  const header = document.querySelector("header");
  const headerHeight = header ? header.offsetHeight : 72;
  const elementPosition = targetElement.getBoundingClientRect().top;
  const offsetPosition = Math.max(
    0,
    elementPosition + window.scrollY - headerHeight - 16,
  );

  smoothScrollTo(offsetPosition, 800);

  if (window.location.hash !== `#${targetId}`) {
    history.pushState(null, "", `#${targetId}`);
  }
}
