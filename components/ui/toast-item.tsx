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
        className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5"
        data-slot="toast-content"
      >
        <div className="col-start-1 row-start-1 shrink-0">
          <ToastIcon type={toast.type} />
        </div>
        <ToastPrimitive.Title
          className="col-start-2 row-start-1 min-w-0 text-xs font-semibold wrap-anywhere text-peat-forest"
          data-slot="toast-title"
        />
        <ToastPrimitive.Description
          className="col-span-3 col-start-1 row-start-2 min-w-0 text-xs leading-relaxed wrap-anywhere text-muted-foreground"
          data-slot="toast-description"
        />
        <ToastCloseButton className="col-start-3 row-start-1" />
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  );
}
