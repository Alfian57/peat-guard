"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, CircleUserRound, LogOut } from "lucide-react";

import { LogoutConfirmationDialog } from "@/components/auth/logout-confirmation-dialog";
import { UserAvatar } from "@/components/auth/user-avatar";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import { APP_ROUTES } from "@/lib/routes";

export function UserAccountMenu({
  name,
  email,
  role,
  image,
  compactOnMobile = false,
}: {
  name: string;
  email: string;
  role: AppRole;
  image: string | null;
  compactOnMobile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        if (
          (event.target as Element).closest?.(
            "[role='dialog'], [role='alertdialog'], [data-portal], dialog",
          )
        ) {
          return;
        }
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
        className="inline-flex min-h-10 items-center gap-2 rounded-full p-1 pr-2.5 text-peat-forest transition hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        <UserAvatar className="size-9 shrink-0" image={image} name={name} />
        <div
          className={`min-w-0 text-left ${compactOnMobile ? "hidden sm:block" : ""}`}
        >
          <p
            className="max-w-[130px] truncate text-xs leading-tight font-bold text-peat-forest"
            title={email}
          >
            {name}
          </p>
          <p className="text-[10px] leading-tight font-semibold text-peat-green">
            {ROLE_LABELS[role]}
          </p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 text-peat-forest/60 ${compactOnMobile ? "hidden sm:block" : ""}`}
          size={14}
        />
      </button>

      {open ? (
        <div
          aria-label="Menu akun"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-44 rounded-2xl border border-peat-forest/10 bg-white p-1.5 shadow-[0_12px_36px_rgba(28,53,42,0.14)]"
          role="group"
        >
          <Link
            className="flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-peat-forest transition hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-peat-green"
            href={APP_ROUTES.profile}
            onClick={() => setOpen(false)}
          >
            <CircleUserRound aria-hidden="true" size={16} />
            Profil
          </Link>
          <div className="my-1 border-t border-peat-forest/10" />
          <button
            className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-[#9c3a2d] transition hover:bg-[#fff1ee] focus-visible:outline-2 focus-visible:outline-peat-green"
            onClick={() => {
              setOpen(false);
              setIsLogoutOpen(true);
            }}
            type="button"
          >
            <LogOut aria-hidden="true" size={16} />
            Keluar
          </button>
        </div>
      ) : null}

      <LogoutConfirmationDialog
        isOpen={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
      />
    </div>
  );
}
