"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";
import { API_ROUTES } from "@/lib/routes";

type ProfileResponse = { name: string; villageName: string | null };

function isProfileResponse(value: unknown): value is ProfileResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string" &&
    "villageName" in value &&
    (typeof value.villageName === "string" || value.villageName === null)
  );
}

export function ProfileDetailsForm({
  name: initialName,
  villageName: initialVillage,
  email,
  roleLabel,
  canEditVillage,
}: {
  name: string;
  villageName: string | null;
  email: string;
  roleLabel: string;
  canEditVillage: boolean;
}) {
  const router = useRouter();
  const { refetch } = authClient.useSession();
  const [name, setName] = useState(initialName);
  const [villageName, setVillageName] = useState(initialVillage ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.profile.root, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          ...(canEditVillage ? { villageName } : {}),
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isProfileResponse(payload)) {
        const messageText =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Profil belum dapat diperbarui.";
        throw new Error(messageText);
      }
      setName(payload.name);
      setVillageName(payload.villageName ?? "");
      await refetch({ query: { disableCookieCache: true } });
      router.refresh();
      setMessage("Perubahan profil berhasil disimpan.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Profil belum dapat diperbarui.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-peat-forest">
          Nama lengkap
          <input
            autoComplete="name"
            className="mt-2 min-h-12 w-full rounded-xl border border-peat-forest/15 bg-white px-3.5 font-normal transition outline-none placeholder:text-peat-forest/35 focus:border-peat-green focus:ring-3 focus:ring-peat-green/10"
            maxLength={100}
            minLength={2}
            onChange={(event) => setName(event.currentTarget.value)}
            required
            value={name}
          />
        </label>
        {canEditVillage ? (
          <label className="block text-sm font-semibold text-peat-forest">
            Desa
            <input
              autoComplete="address-level2"
              className="mt-2 min-h-12 w-full rounded-xl border border-peat-forest/15 bg-white px-3.5 font-normal transition outline-none placeholder:text-peat-forest/35 focus:border-peat-green focus:ring-3 focus:ring-peat-green/10"
              maxLength={100}
              onChange={(event) => setVillageName(event.currentTarget.value)}
              placeholder="Nama desa"
              value={villageName}
            />
          </label>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-peat-forest">Email</p>
          <p className="mt-2 flex min-h-12 items-center rounded-xl border border-peat-forest/10 bg-[#f4f5ef] px-3.5 text-sm text-peat-forest/65">
            {email}
          </p>
          <p className="mt-1.5 text-xs text-peat-forest/50">
            Email tidak dapat diubah.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-peat-forest">Peran</p>
          <p className="mt-2 flex min-h-12 items-center rounded-xl border border-peat-forest/10 bg-[#f4f5ef] px-3.5 text-sm text-peat-forest/65">
            {roleLabel}
          </p>
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
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-peat-forest px-5 text-sm font-bold text-white transition hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? "Menyimpan…" : "Simpan profil"}
      </button>
    </form>
  );
}
