"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
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
    } catch {
      setError("Kata sandi belum dapat diperbarui. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <label className="block text-sm font-semibold text-peat-forest">
        Kata sandi saat ini
        <input
          autoComplete="current-password"
          className="mt-2 min-h-12 w-full rounded-xl border border-peat-forest/15 bg-white px-3.5 font-normal transition outline-none focus:border-peat-green focus:ring-3 focus:ring-peat-green/10"
          onChange={(event) => setCurrentPassword(event.currentTarget.value)}
          required
          type={showPasswords ? "text" : "password"}
          value={currentPassword}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-peat-forest">
          Kata sandi baru
          <input
            autoComplete="new-password"
            className="mt-2 min-h-12 w-full rounded-xl border border-peat-forest/15 bg-white px-3.5 font-normal transition outline-none focus:border-peat-green focus:ring-3 focus:ring-peat-green/10"
            minLength={10}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            required
            type={showPasswords ? "text" : "password"}
            value={newPassword}
          />
        </label>
        <label className="block text-sm font-semibold text-peat-forest">
          Ulangi kata sandi baru
          <input
            autoComplete="new-password"
            className="mt-2 min-h-12 w-full rounded-xl border border-peat-forest/15 bg-white px-3.5 font-normal transition outline-none focus:border-peat-green focus:ring-3 focus:ring-peat-green/10"
            minLength={10}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            required
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
          />
        </label>
      </div>
      <button
        aria-pressed={showPasswords}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-peat-green hover:bg-peat-green/5 focus-visible:outline-2 focus-visible:outline-peat-green"
        onClick={() => setShowPasswords((value) => !value)}
        type="button"
      >
        {showPasswords ? (
          <EyeOff aria-hidden="true" size={15} />
        ) : (
          <Eye aria-hidden="true" size={15} />
        )}
        {showPasswords ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      </button>
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
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-peat-forest px-5 text-sm font-bold text-white transition hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
        ) : (
          <LockKeyhole aria-hidden="true" size={16} />
        )}
        {busy ? "Memperbarui…" : "Perbarui kata sandi"}
      </button>
    </form>
  );
}
