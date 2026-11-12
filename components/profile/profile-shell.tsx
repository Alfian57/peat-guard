"use client";

import type { ReactNode } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { AuditShell } from "@/components/audit/audit-shell";
import { FieldAppShell } from "@/components/field/field-app-shell";
import type { AppRole } from "@/lib/roles";

export function ProfileShell({
  children,
  user,
}: {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    image: string | null;
    role: AppRole;
  };
}) {
  if (user.role === "POSKO") {
    return (
      <CommandShell user={{ ...user, role: "POSKO" }}>{children}</CommandShell>
    );
  }

  if (user.role === "VERIFIKATOR") {
    return <AuditShell user={user}>{children}</AuditShell>;
  }

  return <FieldAppShell demoSamplesEnabled={true}>{children}</FieldAppShell>;
}
