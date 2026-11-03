"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, FileText, Leaf, Map, Menu, X } from "lucide-react";
import { useState } from "react";

import { COMMAND_ROUTES } from "@/components/command/routes";

const navigation = [
  { href: COMMAND_ROUTES.map, label: "Peta komando", icon: Map },
  { href: COMMAND_ROUTES.reports, label: "Daftar insiden", icon: FileText },
  { href: COMMAND_ROUTES.zones, label: "Zona gambut", icon: Leaf },
  {
    href: COMMAND_ROUTES.waterPoints,
    label: "Titik sumber air",
    icon: Droplets,
  },
] as const;

export function CommandShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-peat-paper lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-peat-forest px-5 py-7 text-white lg:flex">
        <Brand />
        <Navigation pathname={pathname} onNavigate={() => undefined} />
        <p className="mt-auto rounded-xl bg-white/10 p-4 text-xs leading-5 text-white/75">
          Panel operasional untuk koordinasi perlindungan lahan gambut.
        </p>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-peat-forest/10 bg-peat-paper/95 px-4 backdrop-blur sm:px-7 lg:hidden">
          <Brand compact />
          <button
            aria-expanded={mobileNavigationOpen}
            aria-label={
              mobileNavigationOpen ? "Tutup navigasi" : "Buka navigasi"
            }
            className="inline-grid size-11 place-items-center rounded-xl border border-peat-forest/15 bg-white text-peat-forest"
            onClick={() => setMobileNavigationOpen((open) => !open)}
            type="button"
          >
            {mobileNavigationOpen ? (
              <X aria-hidden="true" size={20} />
            ) : (
              <Menu aria-hidden="true" size={20} />
            )}
          </button>
        </header>

        {mobileNavigationOpen ? (
          <div className="border-b border-peat-forest/10 bg-peat-forest px-4 py-3 text-white lg:hidden">
            <Navigation
              pathname={pathname}
              onNavigate={() => setMobileNavigationOpen(false)}
            />
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-7 xl:p-9">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      aria-label="PEATGUARD, peta komando"
      className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-sun"
      href={COMMAND_ROUTES.map}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-peat-sun text-peat-forest">
        <Leaf aria-hidden="true" size={21} />
      </span>
      <span>
        <span className="block font-heading text-2xl font-bold tracking-wide">
          PEATGUARD
        </span>
        {compact ? null : (
          <span className="block text-xs text-white/65">POSKO OPERASIONAL</span>
        )}
      </span>
    </Link>
  );
}

function Navigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav aria-label="Navigasi POSKO" className="mt-9 space-y-2">
      {navigation.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-sun ${
              isActive
                ? "bg-white text-peat-forest"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            <Icon aria-hidden="true" size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
