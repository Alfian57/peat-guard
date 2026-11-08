import { redirect } from "next/navigation";

import { CommandShell } from "@/components/command/command-shell";
import { getServerSession } from "@/lib/authz";
import { COMMAND_ROUTES } from "@/components/command/routes";
import { APP_ROUTES } from "@/lib/routes";

export const instant = false;

export default async function CommandLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession();

  if (!session) {
    redirect(COMMAND_ROUTES.login);
  }

  if (session.user.role !== "POSKO") {
    redirect(APP_ROUTES.home);
  }

  return <CommandShell>{children}</CommandShell>;
}
