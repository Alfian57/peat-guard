import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { APP_ROUTES } from "@/lib/routes";

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-white/15 bg-peat-forest/35 text-white backdrop-blur-md">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
        <Link
          aria-label="PEATGUARD beranda"
          className="flex shrink-0 items-center gap-2.5 rounded-md text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          href={APP_ROUTES.home}
        >
          <span className="grid size-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-peat-sun">
            <Leaf aria-hidden="true" size={22} strokeWidth={2.2} />
          </span>
          <span className="font-heading text-2xl leading-none font-bold tracking-wide">
            PEATGUARD
          </span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex"
        >
          <Link
            className="transition-colors hover:text-peat-sun"
            href={APP_ROUTES.publicMap}
          >
            Peta pantauan
          </Link>
          <a className="transition-colors hover:text-peat-sun" href="#dampak">
            Dampak karbon
          </a>
          <a
            className="transition-colors hover:text-peat-sun"
            href="#cara-kerja"
          >
            Cara kerja
          </a>
        </nav>

        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-peat-sun px-4 text-sm font-semibold text-peat-forest transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-5"
          href={APP_ROUTES.login}
        >
          <span>Masuk</span>
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>

      <nav
        aria-label="Navigasi bagian"
        className="flex gap-5 overflow-x-auto border-t border-white/15 px-5 py-3 text-sm font-medium text-white/80 md:hidden"
      >
        <Link className="shrink-0" href={APP_ROUTES.publicMap}>
          Peta pantauan
        </Link>
        <a className="shrink-0" href="#dampak">
          Dampak karbon
        </a>
        <a className="shrink-0" href="#cara-kerja">
          Cara kerja
        </a>
      </nav>
    </header>
  );
}
