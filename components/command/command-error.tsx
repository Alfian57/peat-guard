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
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
        <div className="flex-1">
          <p className="font-semibold">Data belum dapat dimuat</p>
          <p className="mt-1 text-sm leading-6">{message}</p>
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
      </div>
    </div>
  );
}
