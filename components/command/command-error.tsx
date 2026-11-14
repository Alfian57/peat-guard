import { AlertCircle, RefreshCw } from "lucide-react";

export function CommandError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      aria-live="polite"
      className="rounded-2xl border border-red-900/15 bg-red-50 p-5 text-red-950"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <AlertCircle aria-hidden="true" className="shrink-0" size={19} />
        <p className="font-semibold">Data belum dapat dimuat</p>
      </div>
      <p className="mt-3 text-sm leading-6 wrap-anywhere">{message}</p>
      {onRetry ? (
        <button
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-950 px-4 text-sm font-semibold text-white hover:bg-red-900"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={15} />
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}
