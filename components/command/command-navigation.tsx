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

export { CommandNavigation as Navigation };
