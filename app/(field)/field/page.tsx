import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/routes";

export default function FieldIndexPage() {
  redirect(APP_ROUTES.field.home);
}
