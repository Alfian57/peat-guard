import Link from "next/link";
import { FilePlus2, Home, ListChecks } from "lucide-react";

import { APP_ROUTES } from "@/lib/routes";

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
  dark = false,
  queueCount = 0,
}: {
  pathname: string;
  onNavigate?: () => void;
  dark?: boolean;
  queueCount?: number;
}) {
  return (
    <nav aria-label="Navigasi relawan sidebar" className="mt-8 space-y-2">
      {navigation.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== APP_ROUTES.field.home && pathname.startsWith(`${href}/`));

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`group relative flex min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
              dark
                ? `focus-visible:outline-peat-sun ${
                    isActive
                      ? "border-white/75 bg-[#f4efdf] text-[#302f28] shadow-[0_8px_22px_rgba(0,0,0,0.18)]"
                      : "border-transparent text-[#d5d8d2] hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
                  }`
                : `focus-visible:outline-peat-green ${
                    isActive
                      ? "border-white bg-white text-peat-forest shadow-[0_8px_22px_rgba(35,57,44,0.08)]"
                      : "border-transparent text-peat-forest/65 hover:border-white/80 hover:bg-white/65 hover:text-peat-forest"
                  }`
            }`}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-xl transition-colors ${
                dark
                  ? isActive
                    ? "bg-peat-sun text-[#302f28]"
                    : "bg-white/[0.08] text-peat-sun group-hover:bg-white/[0.12]"
                  : isActive
                    ? "bg-peat-sun/25 text-peat-forest"
                    : "bg-peat-forest/[0.06] text-peat-green group-hover:bg-white"
              }`}
            >
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
