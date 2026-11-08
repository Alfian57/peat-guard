export function AuditFilterError({ message }: { message: string }) {
  return (
    <p
      aria-live="polite"
      className="rounded-xl border border-critical/20 bg-critical/5 px-4 py-3 text-sm font-medium text-critical"
      role="alert"
    >
      {message}
    </p>
  );
}
