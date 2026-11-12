"use client";

import { Dialog } from "@base-ui/react/dialog";
import { LoaderCircle, LogOut } from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { APP_ROUTES } from "@/lib/routes";

export function LogoutConfirmationDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function confirmLogout() {
    setIsSigningOut(true);
    setErrorMessage(null);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setErrorMessage(
          "Sesi belum dapat ditutup. Periksa koneksi lalu coba lagi.",
        );
        setIsSigningOut(false);
        return;
      }

      onOpenChange(false);
      window.location.replace(APP_ROUTES.login);
    } catch {
      setErrorMessage(
        "Sesi belum dapat ditutup. Periksa koneksi lalu coba lagi.",
      );
      setIsSigningOut(false);
    }
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (open) setErrorMessage(null);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[51] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-border bg-white p-6 shadow-2xl outline-none sm:p-8">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#f4dfb0] text-[#624d20]">
              <LogOut aria-hidden="true" size={21} />
            </div>
            <Dialog.Title className="font-heading text-2xl leading-tight font-bold text-peat-forest sm:text-3xl">
              Keluar dari PEATGUARD?
            </Dialog.Title>
          </div>
          <Dialog.Description className="mt-3 text-sm leading-6 text-peat-forest/70">
            Kamu perlu masuk kembali untuk mengakses ruang kerja akun ini.
          </Dialog.Description>

          {errorMessage ? (
            <p
              className="mt-4 rounded-xl border border-critical/25 bg-critical/5 px-3 py-2 text-sm text-critical"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-peat-forest/10 pt-4">
            <Dialog.Close
              className="inline-flex h-9 min-h-9 items-center justify-center rounded-xl border border-border bg-white px-4 text-xs font-semibold text-peat-forest transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
              disabled={isSigningOut}
              type="button"
            >
              Tetap di sini
            </Dialog.Close>
            <button
              className="inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-xl bg-peat-forest px-4 text-xs font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-70"
              disabled={isSigningOut}
              onClick={confirmLogout}
              type="button"
            >
              {isSigningOut ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={14}
                />
              ) : (
                <LogOut aria-hidden="true" size={14} />
              )}
              {isSigningOut ? "Menutup sesi…" : "Ya, keluar"}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
