"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { X } from "lucide-react";
import { cn } from "cn";

export function ToastCloseButton({ className }: { className?: string }) {
  return (
    <ToastPrimitive.Close
      aria-label="Tutup notifikasi"
      className={cn(
        "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-peat-forest/40 transition-colors hover:bg-peat-paper hover:text-peat-forest focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
      data-slot="toast-close"
    >
      <X aria-hidden="true" size={14} />
    </ToastPrimitive.Close>
  );
}
