import Link from "next/link";
import { Archive, Droplets, FileText, Leaf, Map } from "lucide-react";

import { APP_ROUTES } from "@/lib/routes";
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
  { href: APP_ROUTES.audit.generator, label: "Generator MRV", icon: FileText },
  { href: APP_ROUTES.audit.documents, label: "Arsip MRV", icon: Archive },
] as const;

export function CommandNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav aria-label="Navigasi POSKO" className="space-y-2">
      {navigation.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export { CommandNavigation as Navigation };
