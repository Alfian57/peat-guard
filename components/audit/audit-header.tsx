import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";

import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { GlobalSearch } from "@/components/search/global-search";
import { getServerSession } from "@/lib/authz";
import { isAppRole } from "@/lib/roles";
import { APP_ROUTES } from "@/lib/routes";

import { AuditNav } from "./audit-nav";

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
          className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-md text-peat-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-green"
          href={APP_ROUTES.home}
        >
          <BrandLogo decorative height={40} />
        </Link>

        <AuditNav role={role} />

        <div className="flex shrink-0 items-center gap-2.5">
          {session && role ? (
            <>
              <GlobalSearch />
              <UserAccountMenu
                email={session.user.email}
                image={session.user.image ?? null}
                name={name}
                role={role}
              />
            </>
          ) : null}
          {!session ? (
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-peat-green underline-offset-4 hover:underline"
              href={APP_ROUTES.login}
            >
              Masuk
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export { AuditHeaderFallback } from "./audit-header-fallback";
