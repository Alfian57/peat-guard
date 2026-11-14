"use client";

import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { AuditBrand } from "@/components/audit/audit-brand";
import { AuditNavigation } from "@/components/audit/audit-navigation";
import { GlobalSearch } from "@/components/search/global-search";
import type { AppRole } from "@/lib/roles";

export function AuditShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; image: string | null; role: AppRole };
}) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[#fbfaf6] lg:flex">
      <aside className="audit-hide-on-print sidebar-scroll sticky top-0 z-30 hidden h-dvh w-72 shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-18 shrink-0 items-center border-b border-sidebar-border px-6">
          <AuditBrand />
        </div>
        <div className="px-6 pt-6 pb-7">
          <AuditNavigation
            canVerifyZones={user.role === "VERIFIKATOR"}
            onNavigate={() => undefined}
            pathname={pathname}
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="audit-hide-on-print sticky top-0 z-20 h-18 border-b border-[#e7e6dd] bg-[#fbfaf6]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-9">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="shrink-0 lg:hidden">
                <AuditBrand compact />
              </div>
              <GlobalSearch variant="bar" />
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <UserAccountMenu
                compactOnMobile
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
                className="inline-grid size-11 place-items-center rounded-xl border border-[#dedfd4] bg-white text-peat-forest transition-colors hover:bg-[#f2f1e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green lg:hidden"
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
          <div className="audit-hide-on-print border-b border-sidebar-border bg-sidebar px-4 py-4 lg:hidden">
            <AuditNavigation
              canVerifyZones={user.role === "VERIFIKATOR"}
              onNavigate={() => setMobileNavigationOpen(false)}
              pathname={pathname}
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
