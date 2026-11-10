"use client";

import { Dialog } from "@base-ui/react/dialog";
import { LogOut, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { APP_ROUTES } from "@/lib/routes";

export function LogoutConfirmationButton({
  className,
  iconOnly = false,
  labelClassName,
}: {
  className: string;
  iconOnly?: boolean;
  labelClassName?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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
        return;
      }

      setIsOpen(false);
      router.replace(APP_ROUTES.login);
      router.refresh();
    } catch {
      setErrorMessage(
        "Sesi belum dapat ditutup. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setErrorMessage(null);
      }}
    >
      <Dialog.Trigger
        aria-label="Keluar dari akun"
        className={className}
        disabled={isSigningOut}
        type="button"
      >
        <LogOut aria-hidden="true" size={17} />
        <span className={iconOnly ? "sr-only" : labelClassName}>Keluar</span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#172b22]/55 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[51] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-white/70 bg-peat-paper p-6 shadow-2xl outline-none sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#f4dfb0] text-[#624d20]">
            <LogOut aria-hidden="true" size={21} />
          </div>
          <Dialog.Title className="mt-5 font-heading text-3xl leading-tight font-bold text-peat-forest">
            Keluar dari PEATGUARD?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-peat-forest/70">
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

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-peat-forest/15 bg-white px-4 text-sm font-semibold text-peat-forest transition-colors hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
              disabled={isSigningOut}
              type="button"
            >
              Tetap di sini
            </Dialog.Close>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-70"
              disabled={isSigningOut}
              onClick={confirmLogout}
              type="button"
            >
              {isSigningOut ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={17}
                />
              ) : (
                <LogOut aria-hidden="true" size={17} />
              )}
              {isSigningOut ? "Menutup sesi…" : "Ya, keluar"}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
