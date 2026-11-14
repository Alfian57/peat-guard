import Link from "next/link";
import { FilePlus2, Home, ListChecks } from "lucide-react";

import { APP_ROUTES } from "@/lib/routes";

import { fieldNavigationRoute } from "./field-navigation-state";

const navigation = [
  { href: APP_ROUTES.field.home, label: "Beranda patroli", icon: Home },
  {
    href: APP_ROUTES.field.createReport,
    label: "Lapor temuan",
    icon: FilePlus2,
  },
  { href: APP_ROUTES.field.queue, label: "Antrean laporan", icon: ListChecks },
] as const;

export function FieldNavigation({
  pathname,
  onNavigate,
  queueCount = 0,
}: {
  pathname: string;
  onNavigate?: () => void;
  queueCount?: number;
}) {
  const activeHref = {
    home: APP_ROUTES.field.home,
    create: APP_ROUTES.field.createReport,
    queue: APP_ROUTES.field.queue,
  }[fieldNavigationRoute(pathname)];
  return (
    <nav aria-label="Navigasi relawan sidebar" className="space-y-2">
      {navigation.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`group relative flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-transparent px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring ${
              isActive
                ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60"
            }`}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            {isActive ? (
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-accent-foreground"
              />
            ) : null}
            <span className="grid size-5 shrink-0 place-items-center">
              <Icon aria-hidden="true" size={17} />
            </span>
            <span className="flex-1">{label}</span>
            {href === APP_ROUTES.field.queue && queueCount > 0 ? (
              <span className="rounded-full bg-offline px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                {queueCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export { FieldNavigation as Navigation };
