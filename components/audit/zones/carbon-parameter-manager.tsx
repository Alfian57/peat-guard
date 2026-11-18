"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { requestCommandJson } from "@/components/command/command-api";
import { carbonParameterFields } from "@/lib/mrv/carbon-parameter-fields";
import { API_ROUTES } from "@/lib/routes";
import type { listCarbonParameters } from "@/lib/server/mrv/parameters";

export function CarbonParameterManager({
  parameters,
}: {
  parameters: Awaited<ReturnType<typeof listCarbonParameters>>;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setFeedback("");
    setSaving(true);
    try {
      await requestCommandJson(API_ROUTES.command.mrvParameters, {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          source: data.get("source"),
          isDemoData: data.has("isDemoData"),
          isActive: data.has("isActive"),
          ...Object.fromEntries(
            carbonParameterFields.map(({ name }) => [
              name,
              Number(data.get(name)),
            ]),
          ),
        }),
      });
      form.reset();
      setFeedback("Versi parameter tersimpan.");
      router.refresh();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Versi parameter belum dapat dibuat.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="mb-5 rounded-2xl border border-border bg-white p-5">
      <summary className="cursor-pointer font-semibold">
        Parameter karbon
      </summary>
      <ul className="my-4 space-y-2 text-sm">
        {parameters.map((row) => (
          <li key={row.id}>
            <strong>{row.name}</strong> ·{" "}
            {row.isActive ? "Bawaan zona baru" : "Tersedia"}
            {row.isDemoData ? " · Ilustratif" : ""}
            <p>{row.source ?? "Sumber belum dicatat"}</p>
            <p>
              Biomassa {row.biomassFactor} · EF {row.emissionFactor} · Konversi{" "}
              {row.co2ConversionFactor} · Tarif Rp{row.incentivePerTonIdr}
            </p>
          </li>
        ))}
      </ul>
      <form onSubmit={save} className="space-y-3">
        <h3 className="font-semibold">Tambah versi parameter</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            Nama versi
            <input
              className="block w-full rounded-lg border p-2"
              name="name"
              required
              maxLength={120}
            />
          </label>
          <label>
            Sumber faktor
            <input
              className="block w-full rounded-lg border p-2"
              name="source"
              required
              maxLength={300}
            />
          </label>
          {carbonParameterFields.map(({ name, label, min, max, step }) => (
            <label key={name}>
              {label}
              <input
                className="block w-full rounded-lg border p-2"
                name={name}
                type="number"
                required
                min={min}
                max={max}
                step={step}
              />
            </label>
          ))}
        </div>
        <p>
          <label>
            <input name="isDemoData" type="checkbox" defaultChecked /> Parameter
            ilustratif
          </label>
        </p>
        <p>
          <label>
            <input name="isActive" type="checkbox" /> Jadikan bawaan zona baru
          </label>
        </p>
        <button
          className="rounded-lg bg-peat-forest px-4 py-2 text-white disabled:opacity-60"
          disabled={saving}
        >
          Simpan versi
        </button>
        {feedback ? <p role="status">{feedback}</p> : null}
      </form>
    </details>
  );
}
