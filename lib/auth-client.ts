"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  fetchOptions: {
    onRequest(request) {
      if (
        !new URL(request.url, window.location.origin).pathname.endsWith(
          "/get-session",
        ) ||
        typeof AbortSignal.timeout !== "function" ||
        typeof AbortSignal.any !== "function"
      ) {
        return;
      }
      const timeout = AbortSignal.timeout(8_000);
      request.signal = request.signal
        ? AbortSignal.any([request.signal, timeout])
        : timeout;
    },
  },
});
