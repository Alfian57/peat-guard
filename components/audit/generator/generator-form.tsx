"use client";

import { useState, useTransition, type FormEvent } from "react";
import { LoaderCircle, Printer, Sparkles, TriangleAlert } from "lucide-react";

import type {
  ApprovedZoneValues,
  MrvDocumentType,
  MrvGeneratedReport,
} from "@/lib/server/mrv/contracts";

import { GeneratorReportPreview } from "./generator-report-preview";
import { DocumentTypeSelector } from "./document-type-selector";
import { toast } from "@/components/ui/toast";
import { API_ROUTES } from "@/lib/routes";

function errorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

export function GeneratorForm({ zones }: { zones: ApprovedZoneValues[] }) {
  const [report, setReport] = useState<MrvGeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new window.FormData(form);
    const from = String(formData.get("from") ?? "").trim();
    const to = String(formData.get("to") ?? "").trim();

    if (Boolean(from) !== Boolean(to)) {
      setError("Isi kedua tanggal rentang atau kosongkan keduanya.");
      return;
    }

    const documentType = String(formData.get("documentType") ?? "SITUATION");
    const zoneId = String(formData.get("zoneId") ?? "");
    const includeNarrative = formData.get("aiConsent") === "on";

    if (documentType !== "SITUATION" && documentType !== "CARBON_AUDIT") {
      setError("Pilih jenis laporan yang tersedia.");
      return;
    }

    const requestBody: {
      aiConsent: boolean;
      documentType: MrvDocumentType;
      from?: string;
      includeNarrative: boolean;
      to?: string;
      zoneId?: string;
    } = {
      aiConsent: includeNarrative,
      documentType,
      includeNarrative,
    };

    if (from && to) {
      requestBody.from = from;
      requestBody.to = to;
    }

    if (zoneId) {
      requestBody.zoneId = zoneId;
    }

    setError(null);
    setReport(null);

    startTransition(async () => {
      try {
        const response = await fetch(API_ROUTES.command.mrvGenerate, {
          body: JSON.stringify(requestBody),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          setError(
            errorMessage(
              payload,
              "Laporan belum dapat dibuat. Periksa parameter dan coba lagi.",
            ),
          );
          return;
        }

        setReport(payload as MrvGeneratedReport);
        toast.success(
          "Laporan berhasil dibuat",
          "Rangkuman audit MRV siap ditinjau atau dicetak.",
        );
      } catch {
        setError("Layanan laporan belum dapat dihubungi. Coba lagi sebentar.");
      }
    });
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.5fr)] print:block">
      <section className="audit-hide-on-print min-w-0 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="font-heading text-2xl font-bold text-peat-forest">
          Pilih data yang dirangkum
        </h2>
        <form className="mt-5 space-y-5" onSubmit={submitReport}>
          <DocumentTypeSelector />

          <div className="space-y-2">
            <label
              className="block text-sm font-semibold text-peat-forest"
              htmlFor="generator-zone"
            >
              Zona gambut{" "}
              <span className="font-normal text-muted-foreground">
                (opsional)
              </span>
            </label>
            <select
              className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              defaultValue=""
              id="generator-zone"
              name="zoneId"
            >
              <option value="">Semua zona gambut</option>
              {zones.map((zone) => (
                <option key={zone.zoneId} value={zone.zoneId}>
                  {zone.zoneName}
                  {zone.villageName ? ` · ${zone.villageName}` : ""}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-peat-forest">
              Periode laporan{" "}
              <span className="font-normal text-muted-foreground">
                (opsional)
              </span>
            </legend>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-medium text-muted-foreground"
                  htmlFor="generator-from"
                >
                  Tanggal mulai periode (WIB)
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  id="generator-from"
                  name="from"
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-medium text-muted-foreground"
                  htmlFor="generator-to"
                >
                  Tanggal akhir periode (WIB)
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  id="generator-to"
                  name="to"
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Kedua tanggal harus diisi bersama. Hari kalender mengikuti WIB.
            </p>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-peat-forest/15 bg-white p-4 focus-within:ring-3 focus-within:ring-peat-green/20">
            <input
              className="mt-1 size-4 shrink-0 accent-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              name="aiConsent"
              type="checkbox"
            />
            <span className="text-sm leading-6 text-foreground">
              Saya setuju AI menyusun draf narasi dari angka agregat anonim.
              Nama, koordinat, catatan, dan foto laporan tidak dikirim ke AI.{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (opsional)
              </span>
            </span>
          </label>

          {error ? (
            <p
              aria-live="polite"
              className="rounded-xl border border-critical/20 bg-critical/5 px-4 py-3 text-sm leading-5 text-critical"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-peat-green px-4 text-sm font-semibold text-white transition hover:bg-peat-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-65"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
                size={17}
              />
            ) : (
              <Sparkles aria-hidden="true" size={17} />
            )}
            {isPending ? "Menyusun laporan…" : "Susun laporan"}
          </button>
          <p className="text-xs leading-5 text-muted-foreground">
            Narasi AI hanya dibuat setelah persetujuan dan dapat ditinjau
            sebelum dicetak.
          </p>
        </form>
      </section>

      <section
        aria-busy={isPending}
        aria-live="polite"
        className="flex min-w-0 flex-col gap-5 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6 print:block print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <div className="audit-hide-on-print flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold text-peat-forest">
              Pratinjau dokumen
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {report
                ? "Angka berasal dari database; narasi AI tetap berupa draf."
                : "Hasil laporan akan tampil di sini."}
            </p>
          </div>
          {report ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-peat-forest/10 bg-white px-4 text-sm font-semibold text-peat-green hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onClick={printReport}
              type="button"
            >
              <Printer aria-hidden="true" size={17} />
              Cetak / simpan PDF
            </button>
          ) : null}
        </div>
        {isPending && !report ? (
          <div className="flex min-h-64 flex-1 flex-col items-center justify-center px-4 py-10 text-center">
            <LoaderCircle
              aria-hidden="true"
              className="mx-auto animate-spin text-peat-green motion-reduce:animate-none"
              size={26}
            />
            <p className="mt-3 text-sm font-semibold text-peat-forest">
              Menghitung metrik laporan…
            </p>
          </div>
        ) : report ? (
          <GeneratorReportPreview report={report} />
        ) : (
          <div className="flex min-h-64 flex-1 flex-col items-center justify-center px-4 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-peat-paper text-peat-green">
              <TriangleAlert aria-hidden="true" size={23} />
            </span>
            <p className="mt-4 font-heading text-xl font-bold text-peat-forest">
              Dokumen belum dibuat
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Atur jenis dokumen, wilayah, dan tanggal, lalu susun ringkasan
              untuk melihat metrik yang tersedia.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
