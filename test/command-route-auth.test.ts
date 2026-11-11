import { afterEach, describe, expect, mock, test } from "bun:test";

import { AuthorizationError } from "@/lib/role-access";
import type { AppRole } from "@/lib/roles";

const zoneId = "c5c0f12d-a5a0-438a-9a8c-f0ae8937ac51";
let activeRole: AppRole | null = null;

const approveCommandZone = mock(async () => ({
  zone: { id: zoneId },
  alreadyApproved: false,
}));

mock.module("@/lib/authz", () => ({
  AuthorizationError,
  requireRole: async (allowedRoles: readonly AppRole[]) => {
    if (activeRole === null) {
      throw new AuthorizationError(401);
    }

    if (!allowedRoles.includes(activeRole)) {
      throw new AuthorizationError(403);
    }

    return { user: { id: "actor-id" } };
  },
}));

mock.module("@/lib/server/zones/data", () => ({ approveCommandZone }));

const { POST: approveZone } =
  await import("@/app/api/command/zones/[zoneId]/approve/route");

function makeRequest(): Request {
  return new Request(`http://localhost/api/command/zones/${zoneId}/approve`, {
    method: "POST",
  });
}

function makeContext() {
  return { params: Promise.resolve({ zoneId }) };
}

describe("command route authorization", () => {
  afterEach(() => {
    activeRole = null;
    approveCommandZone.mockClear();
  });

  test("returns 401 to anonymous requests", async () => {
    const response = await approveZone(makeRequest(), makeContext());

    expect(response.status).toBe(401);
    expect(approveCommandZone).not.toHaveBeenCalled();
  });

  test("returns 403 when POSKO attempts to approve a zone", async () => {
    activeRole = "POSKO";

    const response = await approveZone(makeRequest(), makeContext());

    expect(response.status).toBe(403);
    expect(approveCommandZone).not.toHaveBeenCalled();
  });

  test("allows VERIFIKATOR approval and calls the service", async () => {
    activeRole = "VERIFIKATOR";

    const response = await approveZone(makeRequest(), makeContext());

    expect(response.status).toBe(201);
    expect(approveCommandZone).toHaveBeenCalledWith(zoneId, "actor-id");
  });
});
