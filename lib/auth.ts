import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

import { prisma } from "@/lib/prisma";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL?.trim() || undefined;

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const resolvedSecret =
  secret || (isBuildPhase ? "01234567890123456789012345678901" : "");

if (!resolvedSecret || Buffer.byteLength(resolvedSecret, "utf8") < 32) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 bytes.");
}

export const auth = betterAuth({
  appName: "PEATGUARD",
  baseURL,
  secret: resolvedSecret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 10,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "RELAWAN",
        input: false,
      },
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
