import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getServerSession } from "@/lib/authz";
import { getRoleHomeRoute, isAppRole } from "@/lib/roles";

export async function LoginSessionGate() {
  const session = await getServerSession();

  if (session && isAppRole(session.user.role)) {
    redirect(getRoleHomeRoute(session.user.role));
  }

  return <LoginForm />;
}
