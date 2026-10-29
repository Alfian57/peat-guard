import { isAppRole, type AppRole } from "@/lib/roles";

export class AuthorizationError extends Error {
  constructor(readonly status: 401 | 403) {
    super(status === 401 ? "Authentication is required." : "Access is denied.");
    this.name = "AuthorizationError";
  }
}

export function assertRoleAccess(
  authenticated: boolean,
  role: unknown,
  allowedRoles: readonly AppRole[],
): void {
  if (!authenticated) {
    throw new AuthorizationError(401);
  }

  if (!isAppRole(role) || !allowedRoles.includes(role)) {
    throw new AuthorizationError(403);
  }
}
