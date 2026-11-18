"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { APP_ROUTES } from "@/lib/routes";
import { BrandLogo } from "@/components/brand/brand-logo";
import { handleSectionScroll } from "@/components/public/smooth-scroll";
import { configureFieldServiceWorker } from "@/lib/client/offline/service-worker";

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

export function SiteHeader({
  workspaceHref,
}: {
  workspaceHref: string | null;
}) {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isHeroSurface, setIsHeroSurface] = useState(true);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !window.isSecureContext)
      return;

    function registerWorker() {
      // The relawan home reports offline preparation and retries registration.
      void configureFieldServiceWorker(true).catch(() => undefined);
    }

    if (document.readyState === "complete") {
      registerWorker();
      return;
    }

    window.addEventListener("load", registerWorker, { once: true });
    return () => window.removeEventListener("load", registerWorker);
  }, []);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const introduction = document.querySelector(".public-hero__panel");
    const elements = NAV_ITEMS.map((item) =>
      document.getElementById(item.id),
    ).filter((el): el is HTMLElement => Boolean(el));
    let frameId: number | null = null;
    let surfaceObserver: IntersectionObserver | null = null;

    const updateSurface = () => {
      frameId = null;
      const headerHeight = headerRef.current?.offsetHeight ?? 72;
      const sectionMarker = headerHeight + window.innerHeight * 0.16;
      let currentSection = "hero";

      for (const element of elements) {
        if (element.getBoundingClientRect().top <= sectionMarker) {
          currentSection = element.id;
        }
      }

      setActiveSection(currentSection);
      setIsHeroSurface(
        Boolean(
          hero &&
          hero.getBoundingClientRect().bottom > headerHeight &&
          introduction &&
          introduction.getBoundingClientRect().top > headerHeight / 2 + 1,
        ),
      );
    };

    const scheduleUpdate = () => {
      frameId ??= requestAnimationFrame(updateSurface);
    };

    const observeSurface = () => {
      surfaceObserver?.disconnect();
      if (!introduction || !("IntersectionObserver" in window)) return;

      const probe = (headerRef.current?.offsetHeight ?? 72) / 2;
      surfaceObserver = new IntersectionObserver(scheduleUpdate, {
        rootMargin: `-${probe}px 0px -${Math.max(0, window.innerHeight - probe - 1)}px 0px`,
        threshold: 0,
      });
      surfaceObserver.observe(introduction);
    };

    const handleResize = () => {
      observeSurface();
      scheduleUpdate();
    };

    updateSurface();
    observeSurface();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("hashchange", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("hashchange", scheduleUpdate);
      surfaceObserver?.disconnect();
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        isHeroSurface
          ? "border-transparent bg-transparent text-white shadow-none backdrop-blur-none"
          : "border-peat-forest/10 bg-peat-paper/95 text-peat-forest shadow-[0_8px_30px_rgba(20,54,39,.08)] backdrop-blur-md"
      }`}
      ref={headerRef}
    >
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-3 px-5 sm:px-8 xl:gap-5 xl:px-14">
        <Link
          aria-label="PEATGUARD beranda"
          className={`flex min-h-11 w-24 shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 sm:w-auto ${isHeroSurface ? "focus-visible:outline-white" : "focus-visible:outline-peat-green"}`}
          href={APP_ROUTES.home}
          onClick={(e) => {
            if (
              typeof window !== "undefined" &&
              (window.location.pathname === APP_ROUTES.home ||
                window.location.pathname === "")
            ) {
              handleSectionScroll(
                e as unknown as React.MouseEvent<HTMLAnchorElement>,
                APP_ROUTES.homeSections.hero,
              );
            }
          }}
        >
          <BrandLogo decorative tone={isHeroSurface ? "dark" : "light"} />
        </Link>

        <nav
          aria-label="Navigasi utama"
          className={`hidden items-center gap-4 text-sm font-semibold lg:flex xl:gap-7 ${isHeroSurface ? "text-white/85" : "text-peat-forest/75"}`}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                aria-current={isActive ? "location" : undefined}
                className={`relative py-1 transition-colors duration-200 ${
                  isActive
                    ? isHeroSurface
                      ? "font-bold text-peat-sun"
                      : "font-bold text-peat-forest"
                    : isHeroSurface
                      ? "text-white/80 hover:text-white"
                      : "text-peat-forest/80 hover:text-peat-forest"
                }`}
                href={item.href}
                key={item.id}
                onClick={(e) => handleSectionScroll(e, item.href)}
              >
                {item.label}
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-peat-sun transition-all duration-300"
                  />
                ) : null}
              </a>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            className={`hidden min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 sm:inline-flex ${isHeroSurface ? "text-white hover:bg-white/10 focus-visible:outline-white" : "text-peat-forest hover:bg-peat-forest/8 focus-visible:outline-peat-green"}`}
            href={workspaceHref ? APP_ROUTES.profile : APP_ROUTES.login}
          >
            {workspaceHref ? "Profil" : "Masuk"}
          </Link>
          <Link
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-peat-sun px-4 text-sm font-semibold text-peat-forest transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3 sm:px-5 ${
              isHeroSurface
                ? "focus-visible:outline-white"
                : "shadow-sm focus-visible:outline-peat-green"
            }`}
            href={workspaceHref ?? APP_ROUTES.publicMap}
          >
            {workspaceHref ? "Ruang kerja" : "Buka peta"}
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>

      <nav
        aria-label="Navigasi bagian"
        className={`flex gap-6 overflow-x-auto border-t px-5 py-2.5 text-xs font-semibold sm:px-8 lg:hidden ${isHeroSurface ? "border-white/15 text-white/80" : "border-peat-forest/10 text-peat-forest/80"}`}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <a
              aria-current={isActive ? "location" : undefined}
              className={`shrink-0 transition-colors duration-200 ${
                isActive
                  ? isHeroSurface
                    ? "font-bold text-peat-sun"
                    : "font-bold text-peat-forest underline decoration-peat-sun decoration-2 underline-offset-4"
                  : isHeroSurface
                    ? "text-white/80 hover:text-white"
                    : "hover:text-peat-forest"
              }`}
              href={item.href}
              key={item.id}
              onClick={(e) => handleSectionScroll(e, item.href)}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
