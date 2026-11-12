import Link from "next/link";
import { ChartNoAxesCombined, ClipboardList, FileText } from "lucide-react";

import { APP_ROUTES } from "@/lib/routes";

const navigation = [
  {
    href: APP_ROUTES.audit.dashboard,
    label: "Dampak karbon",
    icon: ChartNoAxesCombined,
  },
  {
    href: APP_ROUTES.audit.ledger,
    label: "Log audit MRV",
    icon: ClipboardList,
  },
  {
    href: APP_ROUTES.audit.generator,
    label: "Generator laporan",
    icon: FileText,
  },
] as const;

export function AuditNavigation({
  pathname,
  onNavigate,
  dark = false,
}: {
  pathname: string;
  onNavigate: () => void;
  dark?: boolean;
}) {
  return (
    <nav aria-label="Navigasi Verifikator" className="mt-8 space-y-2">
      {navigation.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`group relative flex min-h-[3.25rem] items-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
