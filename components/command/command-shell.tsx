"use client";

import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { CommandBrand } from "@/components/command/command-brand";
import { CommandNavigation } from "@/components/command/command-navigation";
import { GlobalSearch } from "@/components/search/global-search";

export function CommandShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; image: string | null; role: "POSKO" };
}) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[#fbfaf6] lg:flex">
      <aside className="relative hidden w-72 shrink-0 flex-col overflow-hidden border-r border-[#49483f] bg-gradient-to-b from-[#292b29] via-[#32312d] to-[#3c3930] px-6 py-7 shadow-[8px_0_28px_rgba(0,0,0,0.12)] lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-peat-sun/15 blur-3xl"
        />
        <div className="relative">
          <CommandBrand tone="dark" />
          <div className="mt-10 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#e9c36f]">
            <span className="size-1.5 rounded-full bg-peat-sun shadow-[0_0_10px_rgba(242,190,76,0.6)]" />
            PUSAT KOORDINASI
          </div>
          <CommandNavigation
            dark
            pathname={pathname}
            onNavigate={() => undefined}
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-[#e7e6dd] bg-[#fbfaf6]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[4.5rem] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-9">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="lg:hidden">
                <CommandBrand compact />
              </div>
              <GlobalSearch variant="bar" />
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <UserAccountMenu
                email={user.email}
                image={user.image}
                name={user.name}
                role={user.role}
              />
              <button
                aria-expanded={mobileNavigationOpen}
                aria-label={
                  mobileNavigationOpen ? "Tutup navigasi" : "Buka navigasi"
                }
                className="inline-grid size-9 place-items-center rounded-xl border border-[#dedfd4] bg-white text-peat-forest transition-colors hover:bg-[#f2f1e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green lg:hidden"
                onClick={() => setMobileNavigationOpen((open) => !open)}
                type="button"
              >
                {mobileNavigationOpen ? (
                  <X aria-hidden="true" size={19} />
                ) : (
                  <Menu aria-hidden="true" size={19} />
                )}
              </button>
            </div>
          </div>
        </header>

        {mobileNavigationOpen ? (
          <div className="border-b border-[#49483f] bg-gradient-to-b from-[#292b29] to-[#3c3930] px-4 py-4 lg:hidden">
            <CommandNavigation
              dark
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
