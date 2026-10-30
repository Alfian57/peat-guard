import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-peat-forest/10 bg-peat-paper/95">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
        <Link
          aria-label="PEATGUARD beranda"
          className="flex shrink-0 items-center gap-2.5 rounded-md text-peat-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-green"
          href="/"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-peat-forest text-peat-paper">
            <Leaf aria-hidden="true" size={22} strokeWidth={2.2} />
          </span>
          <span className="font-heading text-2xl leading-none font-bold tracking-wide">
            PEATGUARD
          </span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-8 text-sm font-medium text-peat-forest/80 md:flex"
        >
          <a
            className="transition-colors hover:text-peat-green"
            href="#peta-publik"
          >
            Peta pantauan
          </a>
          <a className="transition-colors hover:text-peat-green" href="#dampak">
            Dampak
          </a>
          <a
            className="transition-colors hover:text-peat-green"
            href="#cara-kerja"
          >
            Cara kerja
          </a>
        </nav>

        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-peat-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-green sm:px-5"
          href="/login"
        >
          <span>Masuk</span>
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>

      <nav
        aria-label="Navigasi bagian"
        className="flex gap-5 overflow-x-auto border-t border-peat-forest/10 px-5 py-3 text-sm font-medium text-peat-forest/80 md:hidden"
      >
        <a className="shrink-0" href="#peta-publik">
          Peta pantauan
        </a>
        <a className="shrink-0" href="#dampak">
          Dampak
        </a>
        <a className="shrink-0" href="#cara-kerja">
          Cara kerja
        </a>
      </nav>
    </header>
  );
}
