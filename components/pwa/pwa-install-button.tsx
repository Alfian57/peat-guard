"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Download, X } from "lucide-react";
import { useRef, useState } from "react";
import { usePwaInstall } from "./pwa-install-provider";

export function PwaInstallButton({ className }: { className: string }) {
  const { canInstall, error, install, installed, ios, isInstalling } =
    usePwaInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  async function handleInstall() {
    if (!canInstall || !(await install())) {
      setGuideOpen(true);
    }
  }

  return (
    <Dialog.Root open={guideOpen} onOpenChange={setGuideOpen}>
      <button
        type="button"
        aria-label={
          installed
            ? "PEATGUARD sudah terpasang"
            : isInstalling
              ? "Membuka pemasangan aplikasi"
              : "Pasang aplikasi relawan"
        }
        title={
          installed ? "PEATGUARD sudah terpasang" : "Pasang aplikasi relawan"
        }
        aria-haspopup={canInstall && !installed ? undefined : "dialog"}
        className={className}
        disabled={isInstalling}
        onClick={() => void handleInstall()}
        ref={triggerRef}
      >
        <Download aria-hidden="true" className="shrink-0" size={16} />
      </button>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-black/50" />
        <Dialog.Popup
          className="fixed top-1/2 left-1/2 z-[81] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-xl outline-none sm:p-6"
          finalFocus={triggerRef}
        >
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="font-heading text-2xl font-bold text-peat-forest">
              {installed ? "PEATGUARD sudah terpasang" : "Pasang PEATGUARD"}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Tutup panduan pemasangan"
              className="grid size-11 shrink-0 place-items-center rounded-xl text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            {installed
              ? "Aplikasi ini sudah tersedia di perangkat. Buka PEATGUARD dari ikon di layar utama."
              : "Setelah terpasang, buka ikon PEATGUARD dan masuk dengan akun relawan untuk menyiapkan akses offline."}
          </Dialog.Description>
          {installed ? (
            <p
              className="mt-3 text-sm leading-6 text-peat-forest"
              role="status"
            >
              PEATGUARD sudah siap digunakan di perangkat ini.
            </p>
          ) : ios ? (
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-peat-forest">
              <li>
                Buka halaman ini di Safari, lalu ketuk <strong>Bagikan</strong>.
              </li>
              <li>
                Pilih <strong>Tambahkan ke Layar Utama</strong>.
              </li>
              <li>
                Aktifkan <strong>Buka sebagai App Web</strong> jika tersedia,
                lalu ketuk <strong>Tambah</strong>.
              </li>
            </ol>
          ) : (
            <p
              className="mt-3 text-sm leading-6 text-peat-forest"
              role="status"
            >
              Buka menu browser dan pilih <strong>Pasang aplikasi</strong> atau{" "}
              <strong>Tambahkan ke layar utama</strong> jika tersedia.
            </p>
          )}
          {error ? (
            <p className="mt-3 text-sm leading-6 text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
