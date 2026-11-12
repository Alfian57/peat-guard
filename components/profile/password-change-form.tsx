"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";

import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (newPassword.length < 10) {
      setError("Kata sandi baru harus berisi minimal 10 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }

    setBusy(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setError(
          "Kata sandi saat ini tidak cocok atau perubahan belum berhasil.",
        );
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(
        "Kata sandi berhasil diperbarui. Sesi di perangkat lain sudah ditutup.",
      );
      toast.success(
        "Kata sandi diperbarui",
        "Kata sandi berhasil diperbarui. Sesi di perangkat lain sudah ditutup.",
      );
    } catch {
      setError("Kata sandi belum dapat diperbarui. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <label
          className="block text-sm font-semibold text-peat-forest"
          htmlFor="current-password"
        >
          Kata sandi saat ini
        </label>
        <div className="relative mt-2">
          <input
            autoComplete="current-password"
            className="min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white pr-10 pl-3.5 text-sm font-normal transition outline-none placeholder:text-peat-forest/35 focus:border-peat-green focus:ring-3 focus:ring-peat-green/10"
            id="current-password"
            onChange={(event) => setCurrentPassword(event.currentTarget.value)}
            placeholder="Masukkan kata sandi saat ini"
            required
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
          />
          <button
            aria-label={
              showCurrent
                ? "Sembunyikan kata sandi saat ini"
                : "Tampilkan kata sandi saat ini"
            }
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1 text-peat-forest/50 transition hover:bg-peat-forest/5 hover:text-peat-forest focus-visible:outline-2 focus-visible:outline-peat-green"
            onClick={() => setShowCurrent((prev) => !prev)}
            type="button"
          >
            {showCurrent ? (
              <EyeOff aria-hidden="true" size={16} />
            ) : (
              <Eye aria-hidden="true" size={16} />
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="block text-sm font-semibold text-peat-forest"
            htmlFor="new-password"
          >
            Kata sandi baru
          </label>
          <div className="relative mt-2">
            <input
              autoComplete="new-password"
              className="min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white pr-10 pl-3.5 text-sm font-normal transition outline-none placeholder:text-peat-forest/35 focus:border-peat-green focus:ring-3 focus:ring-peat-green/10"
              id="new-password"
              minLength={10}
              onChange={(event) => setNewPassword(event.currentTarget.value)}
              placeholder="Minimal 10 karakter"
              required
              type={showNew ? "text" : "password"}
              value={newPassword}
            />
            <button
              aria-label={
                showNew
                  ? "Sembunyikan kata sandi baru"
                  : "Tampilkan kata sandi baru"
              }
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1 text-peat-forest/50 transition hover:bg-peat-forest/5 hover:text-peat-forest focus-visible:outline-2 focus-visible:outline-peat-green"
              onClick={() => setShowNew((prev) => !prev)}
              type="button"
            >
              {showNew ? (
                <EyeOff aria-hidden="true" size={16} />
              ) : (
                <Eye aria-hidden="true" size={16} />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-peat-forest"
            htmlFor="confirm-password"
          >
            Ulangi kata sandi baru
          </label>
          <div className="relative mt-2">
            <input
              autoComplete="new-password"
              className="min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white pr-10 pl-3.5 text-sm font-normal transition outline-none placeholder:text-peat-forest/35 focus:border-peat-green focus:ring-3 focus:ring-peat-green/10"
              id="confirm-password"
              minLength={10}
              onChange={(event) =>
                setConfirmPassword(event.currentTarget.value)
              }
              placeholder="Ulangi kata sandi baru"
              required
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
            />
            <button
              aria-label={
                showConfirm
                  ? "Sembunyikan konfirmasi kata sandi"
                  : "Tampilkan konfirmasi kata sandi"
              }
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1 text-peat-forest/50 transition hover:bg-peat-forest/5 hover:text-peat-forest focus-visible:outline-2 focus-visible:outline-peat-green"
              onClick={() => setShowConfirm((prev) => !prev)}
              type="button"
            >
              {showConfirm ? (
                <EyeOff aria-hidden="true" size={16} />
              ) : (
                <Eye aria-hidden="true" size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-critical" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm font-medium text-peat-green" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex items-center justify-end border-t border-peat-forest/10 pt-4">
        <button
          className="inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-xl bg-peat-forest px-4 text-xs font-semibold text-white transition hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              size={14}
            />
          ) : (
            <LockKeyhole aria-hidden="true" size={14} />
          )}
          {busy ? "Memperbarui…" : "Perbarui kata sandi"}
        </button>
      </div>
    </form>
  );
}
