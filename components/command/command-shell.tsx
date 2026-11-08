"use client";

import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { CommandBrand } from "@/components/command/command-brand";
import { CommandNavigation } from "@/components/command/command-navigation";

export function CommandShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-peat-paper lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-peat-forest px-5 py-7 text-white lg:flex">
        <CommandBrand />
        <CommandNavigation pathname={pathname} onNavigate={() => undefined} />
        <p className="mt-auto rounded-xl bg-white/10 p-4 text-xs leading-5 text-white/75">
          Panel operasional untuk koordinasi perlindungan lahan gambut.
        </p>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-peat-forest/10 bg-peat-paper/95 px-4 backdrop-blur sm:px-7 lg:hidden">
          <CommandBrand compact />
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
            <CommandNavigation
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
