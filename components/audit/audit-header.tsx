import Link from "next/link";
import { Leaf } from "lucide-react";

import { getServerSession } from "@/lib/authz";
import { isAppRole, ROLE_LABELS } from "@/lib/roles";

import { AuditNav } from "./audit-nav";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export async function AuditHeader() {
  const session = await getServerSession();
  const roleValue = session?.user.role;
  const role = isAppRole(roleValue) ? roleValue : null;
  const name = session?.user.name.trim() || "Pengguna";

  return (
    <header className="border-b border-peat-forest/10 bg-peat-paper/95">
      <div className="mx-auto flex min-h-[4.5rem] max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          aria-label="PEATGUARD beranda"
          className="flex shrink-0 items-center gap-2.5 rounded-md text-peat-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-green"
          href="/"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-peat-forest text-peat-paper">
            <Leaf aria-hidden="true" size={22} strokeWidth={2.2} />
          </span>
          <span className="font-heading text-2xl leading-none font-bold tracking-wide">
            PEATGUARD
          </span>
        </Link>

        <AuditNav role={role} />

        <div className="flex shrink-0 items-center gap-2.5">
          {role ? (
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-full bg-peat-green/10 text-sm font-bold text-peat-green"
            >
              {initials(name) || "PG"}
            </span>
          ) : null}
          <div className="hidden text-right sm:block">
            <p className="max-w-40 truncate text-sm font-semibold text-peat-forest">
              {name}
            </p>
            <p className="text-xs text-muted-foreground">
              {role ? ROLE_LABELS[role] : "Area audit"}
            </p>
          </div>
          {!session ? (
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-peat-green underline-offset-4 hover:underline"
              href="/login"
            >
              Masuk
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function AuditHeaderFallback() {
  return (
    <header
      aria-label="Memuat navigasi"
      className="min-h-[4.5rem] border-b border-peat-forest/10 bg-peat-paper/95"
    >
      <div className="mx-auto flex min-h-[4.5rem] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <span className="font-heading text-2xl font-bold tracking-wide text-peat-forest">
          PEATGUARD
        </span>
        <span className="h-8 w-40 animate-pulse rounded-lg bg-peat-forest/10" />
      </div>
    </header>
  );
}
