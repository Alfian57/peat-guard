import Link from "next/link";
import {
  Archive,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  MapPinned,
} from "lucide-react";

import { APP_ROUTES } from "@/lib/routes";

const navigation = [
  {
    href: APP_ROUTES.audit.dashboard,
    label: "Dampak karbon",
    icon: ChartNoAxesCombined,
  },
  { href: APP_ROUTES.audit.zones, label: "Verifikasi zona", icon: MapPinned },
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
  { href: APP_ROUTES.audit.documents, label: "Arsip MRV", icon: Archive },
] as const;

export function AuditNavigation({
  pathname,
  canVerifyZones = false,
  onNavigate,
}: {
  pathname: string;
  canVerifyZones?: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav aria-label="Navigasi Verifikator" className="space-y-2">
      {navigation.map(({ href, label, icon: Icon }) => {
        if (
          !canVerifyZones &&
          (href === APP_ROUTES.audit.zones ||
            href === APP_ROUTES.audit.dashboard ||
            href === APP_ROUTES.audit.ledger)
        )
          return null;
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
