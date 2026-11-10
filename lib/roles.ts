import { APP_ROUTES } from "@/lib/routes";

export const APP_ROLES = ["RELAWAN", "POSKO", "VERIFIKATOR"] as const;

export const ROLE_LABELS = {
  RELAWAN: "Relawan lapangan (MPA)",
  POSKO: "Koordinator posko",
  VERIFIKATOR: "Verifikator karbon / CSR",
} as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export function getRoleHomeRoute(role: unknown): string {
  if (role === "POSKO") {
    return APP_ROUTES.command.map;
  }
  if (role === "VERIFIKATOR") {
    return APP_ROUTES.audit.dashboard;
  }
  if (role === "RELAWAN") {
    return APP_ROUTES.field.home;
  }
  return APP_ROUTES.home;
}
