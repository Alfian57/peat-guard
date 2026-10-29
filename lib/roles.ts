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
