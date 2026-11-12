"use client";

import { useEffect } from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";

import { toast, toastManager } from "./toast";
import { ToastList } from "./toast-list";
import { ToastViewport } from "./toast-viewport";

export function Toaster({
  children,
  ...props
}: Omit<ToastPrimitive.Provider.Props, "toastManager">) {
  useEffect(() => {
    try {
      const flash = sessionStorage.getItem("pg_flash_toast");
      if (flash) {
        sessionStorage.removeItem("pg_flash_toast");
        const parsed = JSON.parse(flash) as {
          description?: string;
          title?: string;
          type?: "error" | "info" | "success" | "warning";
        };
        if (parsed.title) {
          if (parsed.type === "error") {
            toast.error(parsed.title, parsed.description);
          } else if (parsed.type === "info") {
            toast.info(parsed.title, parsed.description);
          } else if (parsed.type === "warning") {
            toast.warning(parsed.title, parsed.description);
          } else {
            toast.success(parsed.title, parsed.description);
          }
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  return (
    <ToastPrimitive.Provider toastManager={toastManager} {...props}>
      {children}
      <ToastPrimitive.Portal data-slot="toast-portal">
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}
