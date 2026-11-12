import type { CommandWaterPoint } from "@/lib/server/water/data";

export function WaterPointDeleteDialog({
  deleting,
  error,
  onCancel,
  onConfirm,
  point,
}: {
  deleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
  point: CommandWaterPoint;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="presentation"
    >
      <section
        aria-labelledby="delete-water-heading"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"
        role="alertdialog"
      >
        <h2
          className="font-heading text-3xl font-bold text-peat-forest"
          id="delete-water-heading"
        >
          Hapus titik air?
        </h2>
        <p className="mt-2 text-sm leading-6 text-peat-forest/75">
          Titik <strong>{point.name}</strong> akan dihapus. Jika masih dipakai
          laporan, server akan menolak penghapusan.
        </p>
        {error ? (
          <p className="mt-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-peat-forest/10 pt-3">
          <button
            className="inline-flex h-9 min-h-9 items-center justify-center rounded-xl border border-border px-4 text-xs font-semibold text-peat-forest transition hover:bg-peat-paper"
            disabled={deleting}
            onClick={onCancel}
            type="button"
          >
            Batal
          </button>
          <button
            className="inline-flex h-9 min-h-9 items-center justify-center rounded-xl bg-red-800 px-4 text-xs font-semibold text-white transition hover:bg-red-900 disabled:opacity-60"
            disabled={deleting}
            onClick={onConfirm}
            type="button"
          >
            {deleting ? "Menghapus…" : "Hapus titik"}
          </button>
        </div>
      </section>
    </div>
  );
}
