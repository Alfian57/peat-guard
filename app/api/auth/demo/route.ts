import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  demoLoginIsEnabled,
  demoPasswordForRole,
  DEMO_USERS,
} from "@/lib/demo-login";
import { isAppRole } from "@/lib/roles";

function errorResponse(status: number, message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  try {
    const configuredBaseUrl =
      process.env.BETTER_AUTH_URL?.trim() || request.url;
    return new URL(origin).origin === new URL(configuredBaseUrl).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!demoLoginIsEnabled()) {
    return errorResponse(404, "Demo login is unavailable.");
  }

  if (!sameOriginRequest(request)) {
    return errorResponse(403, "Demo login request is not allowed.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid demo login request.");
  }

  if (typeof body !== "object" || body === null || !("role" in body)) {
    return errorResponse(400, "Invalid demo login request.");
  }

  const role = body.role;

  if (!isAppRole(role)) {
    return errorResponse(400, "Choose a valid demo role.");
  }

  const demoUser = DEMO_USERS.find((user) => user.role === role);

  if (!demoUser) {
    return errorResponse(400, "Choose a valid demo role.");
  }

  try {
    const result = await auth.api.signInEmail({
      body: {
        email: demoUser.email,
        password: demoPasswordForRole(role),
        rememberMe: true,
      },
      headers: request.headers,
      returnHeaders: true,
    });
    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
    });

    for (const cookie of result.headers.getSetCookie()) {
      responseHeaders.append("Set-Cookie", cookie);
    }

    return new Response(null, { status: 204, headers: responseHeaders });
  } catch {
    return errorResponse(
      503,
      "Demo sign-in failed. Start the local database seed and try again.",
    );
  }
}
