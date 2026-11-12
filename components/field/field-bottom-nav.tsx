import { Home, ListChecks } from "lucide-react";

import { APP_ROUTES } from "@/lib/routes";

export function FieldBottomNav({
  activeRoute,
  queueCount,
}: {
  activeRoute: "home" | "create" | "queue";
  queueCount: number;
}) {
  return (
    <nav
      aria-label="Navigasi relawan"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto grid h-[74px] w-full max-w-lg grid-cols-3 items-center border-t border-border bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(31,77,61,0.08)] backdrop-blur lg:hidden"
    >
      <a
        aria-current={activeRoute === "home" ? "page" : undefined}
        className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-xs focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-peat-green ${
          activeRoute === "home"
            ? "font-semibold text-peat-green"
            : "text-muted-foreground"
        }`}
        href={APP_ROUTES.field.home}
      >
        <Home aria-hidden="true" size={20} />
        Beranda
      </a>
      <a
        aria-current={activeRoute === "create" ? "page" : undefined}
        className="mx-auto flex min-h-11 w-[134px] cursor-pointer items-center justify-center rounded-xl bg-peat-green px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-peat-forest focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest"
        href={APP_ROUTES.field.createReport}
      >
        + Lapor temuan
      </a>
      <a
        aria-current={activeRoute === "queue" ? "page" : undefined}
        className={`relative flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-xs focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-peat-green ${
          activeRoute === "queue"
            ? "font-semibold text-peat-green"
            : "text-muted-foreground"
        }`}
        href={APP_ROUTES.field.queue}
      >
        <ListChecks aria-hidden="true" size={20} />
        Antrean
        {queueCount ? (
          <span className="absolute top-1 right-4 grid min-h-5 min-w-5 place-items-center rounded-full bg-offline px-1 text-[10px] font-bold text-white">
            {queueCount}
          </span>
        ) : null}
      </a>
    </nav>
  );
}
