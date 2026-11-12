"use client";

import { Camera, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";

import { UserAvatar } from "@/components/auth/user-avatar";
import { authClient } from "@/lib/auth-client";
import { API_ROUTES } from "@/lib/routes";

export function ProfileAvatarPicker({
  image,
  name,
}: {
  image: string | null;
  name: string;
}) {
  const router = useRouter();
  const { refetch } = authClient.useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!["image/jpeg", "image/webp"].includes(selectedFile.type)) {
      setError("Pilih file foto berformat JPEG atau WebP.");
      setSuccess(null);
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 8 * 1024 * 1024) {
      setError("Ukuran foto maksimal 8 MB.");
      setSuccess(null);
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const body = new FormData();
      body.set("avatar", selectedFile);
      const response = await fetch(API_ROUTES.profile.avatarUpload, {
        method: "PUT",
        body,
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const messageText =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Foto profil belum dapat disimpan.";
        throw new Error(messageText);
      }

      await refetch({ query: { disableCookieCache: true } });
      router.refresh();
      setSuccess("Foto profil berhasil diperbarui.");
    } catch (saveError) {
      setPreview(null);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Foto profil belum dapat disimpan.",
      );
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <input
        accept="image/jpeg,image/webp"
        aria-label="Unggah foto profil"
        className="sr-only"
        disabled={busy}
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />
      <button
        aria-label="Ubah foto profil"
        className="group relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-full ring-2 ring-peat-forest/15 transition hover:ring-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:cursor-wait sm:size-24"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        <UserAvatar
          className="size-full text-lg shadow-xs"
          image={preview ?? image}
          name={name}
        />
        <div className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera aria-hidden="true" size={22} />
        </div>
        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-black/60 text-white">
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              size={24}
            />
          </div>
        ) : (
          <span className="absolute right-1 bottom-1 grid size-6 place-items-center rounded-full border-2 border-white bg-peat-sun text-peat-forest shadow-xs">
            <Camera aria-hidden="true" size={12} />
          </span>
        )}
      </button>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-peat-forest">Foto profil</p>
        <p className="mt-0.5 text-xs text-peat-forest/60">
          Klik foto untuk mengganti. Format JPEG atau WebP, maks. 8 MB.
        </p>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-critical" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p
            className="mt-1.5 text-xs font-medium text-peat-green"
            role="status"
          >
            {success}
          </p>
        ) : null}
      </div>
    </div>
  );
}
