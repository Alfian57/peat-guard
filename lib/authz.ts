import { headers } from "next/headers";

import { auth, type AuthSession } from "@/lib/auth";
import { AuthorizationError, assertRoleAccess } from "@/lib/role-access";
import type { AppRole } from "@/lib/roles";

export { AuthorizationError, assertRoleAccess } from "@/lib/role-access";

export async function getServerSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireRole(
  allowedRoles: readonly AppRole[],
  requestHeaders?: Headers,
): Promise<AuthSession> {
  const session = await auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  });

  assertRoleAccess(Boolean(session), session?.user.role, allowedRoles);

  if (!session) {
    throw new AuthorizationError(401);
  }

  return session;
}
