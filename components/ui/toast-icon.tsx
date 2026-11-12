import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";

export function ToastIcon({ type }: { type?: string }) {
  if (type === "success") {
    return (
      <CheckCircle2
        aria-hidden="true"
        className="size-4.5 shrink-0 text-peat-green"
      />
    );
  }

  if (type === "error") {
    return (
      <AlertCircle
        aria-hidden="true"
        className="size-4.5 shrink-0 text-destructive"
      />
    );
  }

  if (type === "warning") {
    return (
      <AlertTriangle
        aria-hidden="true"
        className="size-4.5 shrink-0 text-amber-600"
      />
    );
  }

  if (type === "info") {
    return (
      <Info aria-hidden="true" className="size-4.5 shrink-0 text-peat-forest" />
    );
  }

  if (type === "loading") {
    return (
      <Loader2
        aria-hidden="true"
        className="size-4.5 shrink-0 animate-spin text-peat-green"
      />
    );
  }

  return null;
}
