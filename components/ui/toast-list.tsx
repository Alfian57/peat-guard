"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";

import { ToastItem } from "./toast-item";

export function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return (
    <>
      {toasts.map((toastItem) => (
        <ToastItem key={toastItem.id} toast={toastItem} />
      ))}
    </>
  );
}
