"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { LogoutConfirmationDialog } from "@/components/auth/logout-confirmation-dialog";

export function LogoutConfirmationButton({
  className,
  iconOnly = false,
  labelClassName,
}: {
  className: string;
  iconOnly?: boolean;
  labelClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Keluar dari akun"
        className={className}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <LogOut aria-hidden="true" size={17} />
        <span className={iconOnly ? "sr-only" : labelClassName}>Keluar</span>
      </button>

      <LogoutConfirmationDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
