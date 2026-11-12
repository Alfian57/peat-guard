"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cn } from "cn";

export function ToastViewport({
  className,
  ...props
}: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        "pointer-events-none fixed right-4 bottom-4 z-50 flex max-h-screen w-[min(calc(100%-2rem),24rem)] flex-col gap-2 outline-none sm:right-6 sm:bottom-6",
        className,
      )}
      data-slot="toast-viewport"
      {...props}
    />
  );
}
