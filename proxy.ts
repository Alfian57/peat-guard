import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest): NextResponse {
  if (getSessionCookie(request)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/field/:path*", "/command/:path*", "/audit/:path*"],
};
