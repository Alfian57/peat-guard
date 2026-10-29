import { createHmac } from "node:crypto";

import { APP_ROLES, type AppRole } from "@/lib/roles";

export const DEMO_USERS: ReadonlyArray<{
  id: string;
  role: AppRole;
  email: string;
  name: string;
  villageName: string;
}> = [
  {
    id: "70000000-0000-4000-8000-000000000001",
    role: "RELAWAN",
    email: "relawan.demo@peatguard.local",
    name: "Relawan Demo",
    villageName: "Desa Demo Gambut",
  },
  {
    id: "70000000-0000-4000-8000-000000000002",
    role: "POSKO",
    email: "posko.demo@peatguard.local",
    name: "Koordinator Posko Demo",
    villageName: "Desa Demo Gambut",
  },
  {
    id: "70000000-0000-4000-8000-000000000003",
    role: "VERIFIKATOR",
    email: "verifikator.demo@peatguard.local",
    name: "Verifikator Demo",
    villageName: "Desa Demo Gambut",
  },
];

export function demoLoginIsEnabled(
  enabled = process.env.ENABLE_DEMO_LOGIN,
  nodeEnvironment = process.env.NODE_ENV,
): boolean {
  return enabled === "1" && nodeEnvironment !== "production";
}

export function demoPasswordForRole(
  role: AppRole,
  secret = process.env.BETTER_AUTH_SECRET,
): string {
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 bytes.");
  }

  if (!APP_ROLES.includes(role)) {
    throw new Error("Unknown demo role.");
  }

  return createHmac("sha256", secret)
    .update(`peatguard-demo-login:${role}`)
    .digest("base64url");
}
