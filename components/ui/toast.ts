import { Toast as ToastPrimitive } from "@base-ui/react/toast";

export const toastManager = ToastPrimitive.createToastManager();

export const toast = {
  add: (options: Parameters<typeof toastManager.add>[0]) =>
    toastManager.add(options),
  close: (id?: string) => toastManager.close(id),
  error: (title: string, description?: string) =>
    toastManager.add({
      description,
      timeout: 5000,
      title,
      type: "error",
    }),
  flash: (
    title: string,
    description?: string,
    type: "error" | "info" | "success" | "warning" = "success",
  ) => {
    try {
      sessionStorage.setItem(
        "pg_flash_toast",
        JSON.stringify({ description, title, type }),
      );
    } catch {
      // Ignore storage error
    }
  },
  info: (title: string, description?: string) =>
    toastManager.add({
      description,
      timeout: 4000,
      title,
      type: "info",
    }),
  success: (title: string, description?: string) =>
    toastManager.add({
      description,
      timeout: 4000,
      title,
      type: "success",
    }),
  warning: (title: string, description?: string) =>
    toastManager.add({
      description,
      timeout: 4000,
      title,
      type: "warning",
    }),
};

export const useToastManager = ToastPrimitive.useToastManager;
