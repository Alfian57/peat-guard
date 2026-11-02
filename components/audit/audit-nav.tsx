"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesCombined, ClipboardList, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { AppRole } from "@/lib/roles";

type AuditNavProps = {
  role: AppRole | null;
};

const navigationItems: {
  href: string;
  icon: LucideIcon;
  label: string;
  roles: readonly AppRole[];
}[] = [
  {
    href: "/audit/dashboard",
    icon: ChartNoAxesCombined,
    label: "Dampak karbon",
    roles: ["VERIFIKATOR"],
  },
  {
    href: "/audit/ledger",
    icon: ClipboardList,
    label: "Log audit MRV",
    roles: ["VERIFIKATOR"],
  },
  {
    href: "/audit/generator",
    icon: FileText,
    label: "Generator laporan",
    roles: ["POSKO", "VERIFIKATOR"],
  },
];

export function AuditNav({ role }: AuditNavProps) {
  const pathname = usePathname();
  const items = navigationItems.filter((item) =>
    role ? item.roles.includes(role) : false,
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi audit"
      className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm font-semibold text-peat-forest/75 md:gap-2"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 transition-colors hover:bg-peat-forest/5 hover:text-peat-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green ${isActive ? "bg-peat-forest/8 text-peat-green" : ""}`}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
