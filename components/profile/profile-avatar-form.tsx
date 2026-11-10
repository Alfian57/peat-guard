"use client";

import { Camera, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { UserAvatar } from "@/components/auth/user-avatar";
import { authClient } from "@/lib/auth-client";
import { API_ROUTES } from "@/lib/routes";

export function ProfileAvatarForm({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const router = useRouter();
  const { refetch } = authClient.useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  const previewImage = preview?.file === file ? preview.url : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Pilih foto JPEG atau WebP terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.set("avatar", file);
      const response = await fetch(API_ROUTES.profile.avatarUpload, {
        method: "PUT",
        body,
      });
      const payload: unknown = await response.json();
      if (
        !response.ok ||
        typeof payload !== "object" ||
        payload === null ||
        !("image" in payload) ||
        typeof payload.image !== "string"
      ) {
        const messageText =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Foto profil belum dapat disimpan.";
        throw new Error(messageText);
      }
      setFile(null);
      setPreview(null);
      await refetch({ query: { disableCookieCache: true } });
      router.refresh();
      setMessage("Foto profil berhasil diperbarui.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Foto profil belum dapat disimpan.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-5 sm:flex-row sm:items-center"
      onSubmit={submit}
    >
      <div className="relative w-fit">
        <UserAvatar
          className="size-24 text-lg shadow-md ring-4 ring-white"
          image={previewImage ?? image}
          name={name}
        />
        <span className="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full border-2 border-white bg-peat-sun text-peat-forest">
          <Camera aria-hidden="true" size={15} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <label
          className="block text-sm font-semibold text-peat-forest"
          htmlFor="profile-avatar"
        >
          Foto profil
        </label>
        <input
          accept="image/jpeg,image/webp"
          className="mt-2 block min-h-11 w-full max-w-md rounded-xl border border-peat-forest/15 bg-white px-3 py-2 text-sm text-peat-forest file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf2e9] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-peat-green focus-visible:outline-2 focus-visible:outline-peat-green"
          id="profile-avatar"
          onChange={(event) => {
            const selectedFile = event.currentTarget.files?.[0] ?? null;
            setFile(selectedFile);
            setPreview(
              selectedFile
                ? {
                    file: selectedFile,
                    url: URL.createObjectURL(selectedFile),
                  }
                : null,
            );
            setError(null);
            setMessage(null);
          }}
          type="file"
        />
        <p className="mt-1.5 text-xs leading-5 text-peat-forest/55">
          Format JPEG atau WebP, maksimal 8 MB. Foto dipotong persegi dan
          metadata dihapus.
        </p>
        {error ? (
          <p className="mt-2 text-sm text-critical" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-2 text-sm font-medium text-peat-green" role="status">
            {message}
          </p>
        ) : null}
        <button
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-peat-forest/15 bg-white px-4 text-sm font-bold text-peat-forest transition hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-60"
          disabled={busy || !file}
          type="submit"
        >
          {busy ? (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              size={16}
            />
          ) : null}
          {busy ? "Mengunggah…" : "Perbarui foto"}
        </button>
      </div>
    </form>
  );
}
