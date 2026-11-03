export function ZoneApprovalResetDialog({
  isSaving,
  onCancel,
  onConfirm,
  zoneName,
}: {
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  zoneName: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-peat-forest/55 p-4"
      role="presentation"
    >
      <section
        aria-labelledby="approval-reset-heading"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        role="alertdialog"
      >
        <h2
          className="font-heading text-3xl font-bold text-peat-forest"
          id="approval-reset-heading"
        >
          Persetujuan akan dicabut
        </h2>
        <p className="mt-2 text-sm leading-6 text-peat-forest/75">
          Perubahan batas atau kedalaman gambut pada <strong>{zoneName}</strong>{" "}
          akan mencabut status persetujuan Verifikator. Lanjutkan menyimpan
          perubahan?
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-xl border border-peat-forest/20 px-4 text-sm font-semibold text-peat-forest"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            Tinjau kembali
          </button>
          <button
            className="min-h-11 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white hover:bg-peat-green disabled:opacity-60"
            disabled={isSaving}
            onClick={onConfirm}
            type="button"
          >
            {isSaving ? "Menyimpan…" : "Simpan dan cabut persetujuan"}
          </button>
        </div>
      </section>
    </div>
  );
}
