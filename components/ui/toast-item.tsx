"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cn } from "cn";

import { ToastCloseButton } from "./toast-close-button";
import { ToastIcon } from "./toast-icon";

export type ToastItemProps = ToastPrimitive.Root.Props;

export function ToastItem({ className, toast, ...props }: ToastItemProps) {
  return (
    <ToastPrimitive.Root
      className={cn(
        "group/toast pointer-events-auto relative flex w-full max-w-sm origin-bottom items-center gap-3 rounded-2xl border border-peat-forest/15 bg-white p-3.5 text-peat-forest shadow-[0_12px_36px_rgba(20,40,30,0.12)] transition-all duration-300 ease-out will-change-transform select-none sm:max-w-md",
        "data-starting-style:translate-y-4 data-starting-style:opacity-0",
        "data-ending-style:translate-y-2 data-ending-style:opacity-0",
        className,
      )}
      data-slot="toast"
      toast={toast}
      {...props}
    >
      <ToastPrimitive.Content
        className="flex w-full min-w-0 items-start gap-3"
        data-slot="toast-content"
      >
        <div className="mt-0.5 shrink-0">
          <ToastIcon type={toast.type} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ToastPrimitive.Title
            className="text-xs font-semibold text-peat-forest"
            data-slot="toast-title"
          />
          <ToastPrimitive.Description
            className="text-[11px] leading-relaxed text-peat-forest/70"
            data-slot="toast-description"
          />
        </div>
        <ToastCloseButton />
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  );
}
