"use client";

import { useState, type FormEvent } from "react";
import { API_ROUTES } from "@/lib/routes";

export function EvidenceFollowUp({
  reportId,
  request,
  onSent,
}: {
  reportId: string;
  request: { reviewId: string; note: string };
  onSent?: () => void;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("reviewId", request.reviewId);
    setError("");
    setState("sending");
    try {
      const response = await fetch(API_ROUTES.reports.followUp(reportId), {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Tindak lanjut belum dapat dikirim.");
      setState("sent");
      onSent?.();
    } catch (error) {
      setState("idle");
      setError(
        error instanceof Error
          ? error.message
          : "Tindak lanjut belum dapat dikirim.",
      );
    }
  }

  return (
    <section className="rounded-xl border border-warning/30 bg-white p-4">
      <h2 className="font-heading text-xl font-bold">
        Verifikator meminta tindak lanjut
      </h2>
      <p className="my-2 text-sm whitespace-pre-wrap">{request.note}</p>
      {state === "sent" ? (
        <p role="status">Tambahan bukti dikirim untuk ditinjau.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3 text-sm">
          <label className="block">
            Penjelasan
            <textarea
              className="mt-1 block w-full rounded-lg border p-2"
              name="note"
              rows={3}
              maxLength={500}
            />
          </label>
          <label className="block">
            Foto tambahan (JPEG atau WebP)
            <input
              className="mt-1 block w-full"
              name="photo"
              type="file"
              accept="image/jpeg,image/webp"
            />
          </label>
          <button
            className="rounded-lg bg-peat-green px-3 py-2 font-semibold text-white disabled:opacity-60"
            disabled={state === "sending"}
          >
            {state === "sending" ? "Mengirim…" : "Kirim tindak lanjut"}
          </button>
          {error ? <p role="alert">{error}</p> : null}
        </form>
      )}
    </section>
  );
}
