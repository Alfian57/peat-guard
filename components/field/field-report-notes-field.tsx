import { Check } from "lucide-react";
import { TAG_OPTIONS } from "./field-report-options";
import { fieldCapturePanel } from "./field-report-layout";

export function FieldReportNotesField({
  fieldNotes,
  tags,
  onNotesChange,
  onToggleTag,
}: {
  fieldNotes: string;
  tags: string[];
  onNotesChange: (notes: string) => void;
  onToggleTag: (tag: string) => void;
}) {
  return (
    <section
      aria-labelledby="notes-title"
      className={`flex flex-col ${fieldCapturePanel}`}
    >
      <h2
        id="notes-title"
        className="font-heading text-2xl font-bold text-peat-forest"
      >
        Catatan lapangan
      </h2>
      <fieldset className="mt-2">
        <legend className="text-sm text-muted-foreground">
          Pilih kategori temuan{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (opsional)
          </span>
        </legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={tags.includes(tag)}
              onClick={() => onToggleTag(tag)}
              className={`min-h-9 rounded-full border px-3 text-xs focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-peat-green ${tags.includes(tag) ? "border-peat-green bg-peat-forest text-white" : "border-border bg-white text-peat-forest hover:bg-peat-paper"}`}
            >
              {tags.includes(tag) ? (
                <Check aria-hidden="true" className="mr-1 inline" size={14} />
              ) : null}
              {tag}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-3 flex flex-1 flex-col text-sm font-semibold text-peat-forest">
        <span>
          Keterangan tambahan{" "}
          <span className="font-normal text-muted-foreground">(opsional)</span>
        </span>
        <textarea
          value={fieldNotes}
          onChange={(event) => onNotesChange(event.target.value)}
          maxLength={1000}
          rows={3}
          className="mt-1 w-full flex-1 resize-y rounded-xl border border-peat-forest/10 bg-white p-2.5 text-base font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-peat-green sm:text-sm"
          placeholder="Jelaskan kondisi sekitar, waktu pengamatan, atau tindak lanjut yang diperlukan..."
        />
      </label>
      <p className="mt-1 text-right text-xs text-muted-foreground">
        {fieldNotes.length}/1000
      </p>
    </section>
  );
}
