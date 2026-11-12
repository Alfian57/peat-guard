import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuditShell } from "@/components/audit/audit-shell";
import { getServerSession } from "@/lib/authz";
import { isAppRole } from "@/lib/roles";
import { APP_ROUTES } from "@/lib/routes";

import "./audit.css";

export default async function AuditLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getServerSession();

  if (!session) {
    redirect(APP_ROUTES.login);
  }

  const role = session.user.role;
  if (!isAppRole(role) || (role !== "VERIFIKATOR" && role !== "POSKO")) {
    redirect(APP_ROUTES.home);
  }

  return (
    <AuditShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
        role,
      }}
    >
      {children}
    </AuditShell>
  );
}
