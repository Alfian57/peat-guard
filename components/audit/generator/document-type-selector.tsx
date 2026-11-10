export function DocumentTypeSelector() {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-peat-forest">
        Jenis dokumen{" "}
        <span className="text-red-500" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-[5.5rem] cursor-pointer items-start gap-3 rounded-xl border border-border bg-white p-4 transition hover:border-peat-green has-[:checked]:border-peat-green has-[:checked]:bg-peat-green/5 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-peat-green/25">
          <input
            className="mt-1 size-4 accent-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            defaultChecked
            name="documentType"
            type="radio"
            value="SITUATION"
          />
          <span>
            <span className="block text-sm font-semibold text-peat-forest">
              Laporan situasi harian
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              Kejadian dan tindak lanjut posko
            </span>
          </span>
        </label>
        <label className="flex min-h-[5.5rem] cursor-pointer items-start gap-3 rounded-xl border border-border bg-white p-4 transition hover:border-peat-green has-[:checked]:border-peat-green has-[:checked]:bg-peat-green/5 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-peat-green/25">
          <input
            className="mt-1 size-4 accent-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            name="documentType"
            type="radio"
            value="CARBON_AUDIT"
          />
          <span>
            <span className="block text-sm font-semibold text-peat-forest">
              Audit karbon bulanan
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              Dampak pencegahan dan jejak bukti
            </span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
