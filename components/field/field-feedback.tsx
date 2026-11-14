import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FieldFeedback({
  icon: Icon,
  title,
  children,
  action,
  role,
  variant = "notice",
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  role?: "status" | "alert";
  variant?: "notice" | "empty";
  className?: string;
}) {
  const isEmpty = variant === "empty";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white",
        isEmpty
          ? "border-dashed border-peat-forest/20 px-4 py-5 text-center"
          : "border-peat-forest/10 p-3",
        className,
      )}
      role={role}
    >
      <div className={cn("flex items-center gap-2", isEmpty && "flex-col")}>
        <span
          className={cn(
            "shrink-0 text-peat-green",
            isEmpty &&
              "grid size-9 place-items-center rounded-xl bg-peat-paper",
          )}
        >
          <Icon aria-hidden="true" size={18} />
        </span>
        {isEmpty ? (
          <h3 className="font-heading text-xl font-bold text-peat-forest">
            {title}
          </h3>
        ) : (
          <p className="text-sm font-semibold text-peat-forest">{title}</p>
        )}
      </div>
      <p
        className={cn(
          "mt-1.5 text-sm leading-5 text-muted-foreground",
          isEmpty && "mx-auto max-w-md",
        )}
      >
        {children}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
