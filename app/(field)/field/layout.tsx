import type { ReactNode } from "react";
import { FieldAppShell } from "@/components/field/field-app-shell";

export const instant = false;

export default function FieldLayout({ children }: { children: ReactNode }) {
  return <FieldAppShell demoSamplesEnabled={true}>{children}</FieldAppShell>;
}
