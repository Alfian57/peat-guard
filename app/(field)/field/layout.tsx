import type { ReactNode } from "react";
import { FieldAppShell } from "@/components/field/field-app-shell";
import { demoLoginIsEnabled } from "@/lib/demo-login";

export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <FieldAppShell demoSamplesEnabled={demoLoginIsEnabled()}>
      {children}
    </FieldAppShell>
  );
}
