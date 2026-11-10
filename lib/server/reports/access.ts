import "server-only";

import { DEMO_USERS } from "@/lib/demo-login";
import { AuthorizationError, assertRoleAccess } from "@/lib/role-access";
import { isAppRole, type AppRole } from "@/lib/roles";

export type ReportActor = {
  id: string;
  email: string;
  role: AppRole;
};

export type ReportActorSource = {
  id: string;
  email: string;
  role: unknown;
};

export const REPORT_READ_ROLES = [
  "RELAWAN",
  "POSKO",
  "VERIFIKATOR",
] as const satisfies readonly AppRole[];

export function reportActorFromSession(user: ReportActorSource): ReportActor {
  if (!isAppRole(user.role)) throw new AuthorizationError(403);

  return { id: user.id, email: user.email, role: user.role };
}

export function assertCanCreateReport(actor: ReportActor): void {
  assertRoleAccess(true, actor.role, ["RELAWAN"]);
}

export function assertCanReadReports(actor: ReportActor): void {
  assertRoleAccess(true, actor.role, REPORT_READ_ROLES);
}

export function assertCanChangeReportStatus(actor: ReportActor): void {
  assertRoleAccess(true, actor.role, ["POSKO"]);
}

export function reportReadScope(actor: ReportActor): { reporterId?: string } {
  assertCanReadReports(actor);
  return actor.role === "RELAWAN" ? { reporterId: actor.id } : {};
}

export function isLocalDemoVolunteer(actor: ReportActor): boolean {
  if (actor.role !== "RELAWAN") {
    return false;
  }

  return DEMO_USERS.some(
    (user) =>
      user.role === "RELAWAN" &&
      user.id === actor.id &&
      user.email === actor.email,
  );
}
