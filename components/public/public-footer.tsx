"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";

import { handleSectionScroll } from "@/components/public/smooth-scroll";
import { APP_ROUTES } from "@/lib/routes";

const CURRENT_YEAR = 2026;

export function PublicFooter() {
  return (
    <footer className="bg-[#173b2f] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.2fr_.8fr] lg:px-14">
        <div>
          <Link
            aria-label="PEATGUARD beranda"
            className="inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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
            <BrandLogo decorative height={48} tone="dark" />
          </Link>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/70">
            WebGIS untuk pemantauan dan perlindungan gambut, dengan informasi
            publik yang dapat ditelusuri.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold tracking-[.16em] text-peat-leaf uppercase">
              Jelajahi
            </h2>
            <nav
              aria-label="Navigasi footer"
              className="mt-4 flex flex-col gap-3 text-sm text-white/80"
            >
              <a
                className="w-fit transition-colors hover:text-white"
                href={APP_ROUTES.homeSections.monitoring}
                onClick={(e) =>
                  handleSectionScroll(e, APP_ROUTES.homeSections.monitoring)
                }
              >
                Ringkasan pantauan
              </a>
              <a
                className="w-fit transition-colors hover:text-white"
                href={APP_ROUTES.homeSections.publicMap}
                onClick={(e) =>
                  handleSectionScroll(e, APP_ROUTES.homeSections.publicMap)
                }
              >
                Peta publik
              </a>
              <a
                className="w-fit transition-colors hover:text-white"
                href={APP_ROUTES.homeSections.workflow}
                onClick={(e) =>
                  handleSectionScroll(e, APP_ROUTES.homeSections.workflow)
                }
              >
                Cara kerja
              </a>
            </nav>
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-[.16em] text-peat-leaf uppercase">
              Akses
            </h2>
            <div className="mt-4 flex flex-col items-start gap-3 text-sm">
              <Link
                className="inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                href={APP_ROUTES.publicMap}
              >
                Buka peta pantauan
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
              <Link
                className="text-white/80 transition-colors hover:text-white"
                href={APP_ROUTES.login}
              >
                Masuk ke PEATGUARD
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs leading-5 text-white/55 sm:px-8">
        © {CURRENT_YEAR} PEATGUARD · Data ilustrasi diberi label secara terbuka.
      </div>
    </footer>
  );
}
