import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { LoginSessionGate } from "@/components/auth/login-session-gate";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginForm />}>
      <LoginSessionGate />
    </Suspense>
  );
}
