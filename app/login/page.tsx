import { LoginForm } from "@/components/auth/login-form";
import { demoLoginIsEnabled } from "@/lib/demo-login";

export default function LoginPage() {
  return <LoginForm demoEnabled={demoLoginIsEnabled()} />;
}
