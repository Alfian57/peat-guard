import "server-only";

import { redirect } from "next/navigation";

import { getServerSession, type AuthSession } from "@/lib/authz";
import { isAppRole, type AppRole } from "@/lib/roles";
import { APP_ROUTES } from "@/lib/routes";

export async function getAuditPageSession(
  allowedRoles: readonly AppRole[],
): Promise<AuthSession | null> {
  const session = await getServerSession();

  if (!session) {
    redirect(APP_ROUTES.login);
  }

  if (
    !isAppRole(session.user.role) ||
    !allowedRoles.includes(session.user.role)
  ) {
    return null;
  }

  return session;
}
