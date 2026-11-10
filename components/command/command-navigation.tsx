import Link from "next/link";
import { Droplets, FileText, Leaf, Map } from "lucide-react";

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

export function CommandNavigation({
  pathname,
  onNavigate,
  dark = false,
}: {
  pathname: string;
  onNavigate: () => void;
  dark?: boolean;
}) {
  return (
    <nav aria-label="Navigasi POSKO" className="mt-8 space-y-2">
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

export { CommandNavigation as Navigation };
