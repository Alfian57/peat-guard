import "server-only";

import { redirect } from "next/navigation";

import { getServerSession, type AuthSession } from "@/lib/authz";
import { isAppRole, type AppRole } from "@/lib/roles";

export async function getAuditPageSession(
  allowedRoles: readonly AppRole[],
): Promise<AuthSession | null> {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (
    !isAppRole(session.user.role) ||
    !allowedRoles.includes(session.user.role)
  ) {
    return null;
  }

  return session;
}
