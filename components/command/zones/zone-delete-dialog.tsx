import type { CommandZone } from "@/lib/server/zones/data";

export function ZoneDeleteDialog({
  deleting,
  error,
  onCancel,
  onConfirm,
  zone,
}: {
  deleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
  zone: CommandZone;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-peat-forest/55 p-4"
      role="presentation"
    >
      <section
        aria-labelledby="delete-zone-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="alertdialog"
      >
        <h2
          className="font-heading text-3xl font-bold text-peat-forest"
          id="delete-zone-title"
        >
          Hapus zona?
        </h2>
        <p className="mt-2 text-sm leading-6 text-peat-forest/75">
          Zona <strong>{zone.name}</strong> akan dihapus. Zona yang masih
          dipakai laporan atau titik sumber air akan ditolak server.
        </p>
        {error ? (
          <p className="mt-3 text-sm leading-5 text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-xl border border-peat-forest/20 px-4 text-sm font-semibold text-peat-forest"
            disabled={deleting}
            onClick={onCancel}
            type="button"
          >
            Batal
          </button>
          <button
            className="min-h-11 rounded-xl bg-red-800 px-4 text-sm font-semibold text-white hover:bg-red-900 disabled:opacity-60"
            disabled={deleting}
            onClick={onConfirm}
            type="button"
          >
            {deleting ? "Menghapus…" : "Hapus zona"}
          </button>
        </div>
      </section>
    </div>
  );
}
