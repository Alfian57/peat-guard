import { FilePlus2, Home, ListChecks } from "lucide-react";

import { APP_ROUTES } from "@/lib/routes";
import type { FieldNavigationRoute } from "./field-navigation-state";

const tabs = [
  { route: "home", href: APP_ROUTES.field.home, label: "Beranda", icon: Home },
  {
    route: "create",
    href: APP_ROUTES.field.createReport,
    label: "Lapor",
    icon: FilePlus2,
  },
  {
    route: "queue",
    href: APP_ROUTES.field.queue,
    label: "Antrean",
    icon: ListChecks,
  },
] as const;

export function FieldBottomNav({
  activeRoute,
  queueCount,
}: {
  activeRoute: FieldNavigationRoute;
  queueCount: number;
}) {
  return (
    <nav
      aria-label="Navigasi relawan"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-peat-forest/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-3 gap-2 px-4 py-2 sm:px-7">
        {tabs.map(({ route, href, label, icon: Icon }) => (
          <a
            aria-current={activeRoute === route ? "page" : undefined}
            aria-describedby={
              route === "queue" && queueCount > 0
                ? "field-queue-count"
                : undefined
            }
            className={
              "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-forest " +
              (activeRoute === route
                ? "bg-sidebar-accent font-semibold text-peat-forest"
                : "text-muted-foreground hover:bg-peat-paper")
            }
            href={href}
            key={route}
          >
            <span className="relative grid h-6 w-8 place-items-center">
              <Icon
                aria-hidden="true"
                size={21}
                strokeWidth={activeRoute === route ? 2 : 1.75}
              />
              {route === "queue" && queueCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-3 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-offline px-1 text-[9px] font-bold text-white"
                >
                  {queueCount > 99 ? "99+" : queueCount}
                </span>
              ) : null}
            </span>
            {label}
          </a>
        ))}
      </div>
      {queueCount > 0 ? (
        <span className="sr-only" id="field-queue-count">
          {queueCount} laporan menunggu sinkronisasi
        </span>
      ) : null}
    </nav>
  );
}
