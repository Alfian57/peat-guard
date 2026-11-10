"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, CircleUserRound } from "lucide-react";

import { LogoutConfirmationButton } from "@/components/auth/logout-confirmation-button";
import { UserAvatar } from "@/components/auth/user-avatar";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import { APP_ROUTES } from "@/lib/routes";

export function UserAccountMenu({
  name,
  email,
  role,
  image,
}: {
  name: string;
  email: string;
  role: AppRole;
  image: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Buka menu akun"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full p-0.5 text-peat-forest transition hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        <UserAvatar className="size-10" image={image} name={name} />
        <ChevronDown aria-hidden="true" className="mr-1" size={15} />
      </button>

      {open ? (
        <div
          aria-label="Menu akun"
          className="absolute top-[calc(100%+0.65rem)] right-0 z-50 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-peat-forest/10 bg-white p-2 shadow-[0_18px_60px_rgba(28,53,42,0.18)]"
          role="group"
        >
          <div className="flex min-w-0 items-center gap-3 rounded-xl bg-[#f5f6ef] px-3 py-3">
            <UserAvatar className="size-11" image={image} name={name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-peat-forest">
                {name}
              </p>
              <p className="truncate text-xs text-peat-forest/60">{email}</p>
              <p className="mt-1 text-[10px] font-semibold tracking-wide text-peat-green">
                {ROLE_LABELS[role]}
              </p>
            </div>
          </div>
          <Link
            className="mt-2 flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-peat-forest transition hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-peat-green"
            href={APP_ROUTES.profile}
            onClick={() => setOpen(false)}
          >
            <CircleUserRound aria-hidden="true" size={17} />
            Profil
          </Link>
          <div className="my-1 border-t border-peat-forest/10" />
          <LogoutConfirmationButton
            className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-[#9c3a2d] transition hover:bg-[#fff1ee] focus-visible:outline-2 focus-visible:outline-peat-green"
            labelClassName=""
          />
        </div>
      ) : null}
    </div>
  );
}
