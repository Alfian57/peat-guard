"use client";

import Link from "next/link";
import { ArrowUpRight, Leaf } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";

import { APP_ROUTES } from "@/lib/routes";

const NAV_ITEMS = [
  {
    href: APP_ROUTES.homeSections.hero,
    id: "hero",
    label: "Beranda",
  },
  {
    href: APP_ROUTES.homeSections.peatlandStory,
    id: "cerita-gambut",
    label: "Mengapa gambut",
  },
  {
    href: APP_ROUTES.homeSections.monitoring,
    id: "pantauan",
    label: "Pantauan",
  },
  {
    href: APP_ROUTES.homeSections.publicMap,
    id: "peta-publik",
    label: "Peta publik",
  },
  {
    href: APP_ROUTES.homeSections.workflow,
    id: "cara-kerja",
    label: "Cara kerja",
  },
];

export function SiteHeader() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isHeroSurface, setIsHeroSurface] = useState(true);
  const isManualScrollingRef = useRef(false);
  const activeAnimationRef = useRef<number | null>(null);

  function smoothScrollTo(targetY: number, duration = 650) {
    if (activeAnimationRef.current !== null) {
      cancelAnimationFrame(activeAnimationRef.current);
      activeAnimationRef.current = null;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      isManualScrollingRef.current = false;
      window.scrollTo(0, targetY);
      return;
    }

    const startY = window.scrollY || window.pageYOffset;
    const distance = targetY - startY;

    if (Math.abs(distance) < 2) {
      isManualScrollingRef.current = false;
      return;
    }

    isManualScrollingRef.current = true;
    let startTime: number | null = null;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (currentTime: number) => {
      startTime ??= currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * ease);

      if (progress < 1) {
        activeAnimationRef.current = requestAnimationFrame(step);
      } else {
        activeAnimationRef.current = null;
        isManualScrollingRef.current = false;
      }
    };

    activeAnimationRef.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    const cancelOnUserInteraction = () => {
      if (activeAnimationRef.current !== null) {
        cancelAnimationFrame(activeAnimationRef.current);
        activeAnimationRef.current = null;
        isManualScrollingRef.current = false;
      }
    };

    window.addEventListener("wheel", cancelOnUserInteraction, {
      passive: true,
    });
    window.addEventListener("touchmove", cancelOnUserInteraction, {
      passive: true,
    });

    return () => {
      window.removeEventListener("wheel", cancelOnUserInteraction);
      window.removeEventListener("touchmove", cancelOnUserInteraction);
      if (activeAnimationRef.current !== null) {
        cancelAnimationFrame(activeAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateHeroSurface = () => {
      const hero = document.getElementById("hero");
      const header = document.querySelector("header");
      const headerHeight = header?.getBoundingClientRect().height ?? 72;
      setIsHeroSurface(
        Boolean(hero && hero.getBoundingClientRect().bottom > headerHeight),
      );
    };

    const handleScroll = () => {
      updateHeroSurface();

      if (isManualScrollingRef.current) {
        return;
      }
      if (window.scrollY < 200) {
        setActiveSection("hero");
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    const elements = NAV_ITEMS.map((item) =>
      document.getElementById(item.id),
    ).filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) {
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrollingRef.current) {
          return;
        }

        for (const entry of entries) {
          if (entry.isIntersecting && window.scrollY >= 200) {
            setActiveSection(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      observer.disconnect();
    };
  }, []);

  function handleSectionClick(
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) {
    if (typeof window === "undefined") {
      return;
    }

    if (sectionId === "hero") {
      event.preventDefault();
      setActiveSection("hero");
      smoothScrollTo(0, 600);
      window.history.pushState(null, "", APP_ROUTES.homeSections.hero);
      return;
    }

    const targetElement = document.getElementById(sectionId);
    if (!targetElement) {
      return;
    }

    event.preventDefault();
    setActiveSection(sectionId);

    const header = document.querySelector("header");
    const headerHeight = header ? header.getBoundingClientRect().height : 80;
    const elementPosition =
      targetElement.getBoundingClientRect().top + window.scrollY;
    const targetScrollPosition = Math.max(
      0,
      elementPosition - headerHeight - 16,
    );

    smoothScrollTo(targetScrollPosition, 650);
    window.history.pushState(null, "", `#${sectionId}`);
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
        isHeroSurface
          ? "border-transparent bg-transparent text-white shadow-none backdrop-blur-none"
          : "border-peat-forest/10 bg-peat-paper/95 text-peat-forest shadow-[0_8px_30px_rgba(20,54,39,.08)] backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-14">
        <Link
          aria-label="PEATGUARD beranda"
          className={`flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 ${isHeroSurface ? "focus-visible:outline-white" : "focus-visible:outline-peat-green"}`}
          href={APP_ROUTES.home}
        >
          <span className="grid size-10 place-items-center rounded-full bg-peat-forest text-peat-sun">
            <Leaf aria-hidden="true" size={21} strokeWidth={2.2} />
          </span>
          <span
            className={`font-heading text-2xl leading-none font-bold tracking-wide ${isHeroSurface ? "text-white" : "text-peat-forest"}`}
          >
            PEATGUARD
          </span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className={`hidden items-center gap-7 text-sm font-semibold lg:flex ${isHeroSurface ? "text-white/85" : "text-peat-forest/75"}`}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                className={`relative py-1 transition-colors duration-200 ${
                  isActive
                    ? isHeroSurface
                      ? "font-bold text-peat-sun"
                      : "font-bold text-peat-forest"
                    : isHeroSurface
                      ? "text-white/80 hover:text-white"
                      : "text-peat-forest/75 hover:text-peat-green"
                }`}
                href={item.href}
                key={item.id}
                onClick={(e) => handleSectionClick(e, item.id)}
              >
                {item.label}
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full transition-all duration-300 ${isHeroSurface ? "bg-peat-sun" : "bg-peat-green"}`}
                  />
                ) : null}
              </a>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            className={`hidden min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 sm:inline-flex ${isHeroSurface ? "text-white hover:bg-white/10 focus-visible:outline-white" : "text-peat-forest hover:bg-peat-forest/8 focus-visible:outline-peat-green"}`}
            href={APP_ROUTES.login}
          >
            Masuk
          </Link>
          <Link
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 sm:px-5 ${isHeroSurface ? "bg-peat-sun text-peat-forest hover:bg-white focus-visible:outline-white" : "bg-peat-forest text-white hover:bg-peat-green focus-visible:outline-peat-green"}`}
            href={APP_ROUTES.publicMap}
          >
            Buka peta
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>

      <nav
        aria-label="Navigasi bagian"
        className={`flex gap-6 overflow-x-auto border-t px-5 py-2.5 text-xs font-semibold sm:px-8 lg:hidden ${isHeroSurface ? "border-white/15 text-white/80" : "border-peat-forest/10 text-peat-forest/70"}`}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <a
              className={`shrink-0 transition-colors duration-200 ${
                isActive
                  ? isHeroSurface
                    ? "font-bold text-peat-sun"
                    : "font-bold text-peat-green"
                  : isHeroSurface
                    ? "text-white/80 hover:text-white"
                    : "hover:text-peat-green"
              }`}
              href={item.href}
              key={item.id}
              onClick={(e) => handleSectionClick(e, item.id)}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
