import type { AppRole } from "@/lib/roles";

export const DEMO_USERS: ReadonlyArray<{
  id: string;
  role: AppRole;
  email: string;
  name: string;
  villageName: string;
}> = [
  {
    id: "70000000-0000-4000-8000-000000000001",
    role: "RELAWAN",
    email: "relawan@gmail.com",
    name: "Relawan Demo",
    villageName: "Desa Demo Gambut",
  },
  {
    id: "70000000-0000-4000-8000-000000000002",
    role: "POSKO",
    email: "posko@gmail.com",
    name: "Koordinator Posko Demo",
    villageName: "Desa Demo Gambut",
  },
  {
    id: "70000000-0000-4000-8000-000000000003",
    role: "VERIFIKATOR",
    email: "verifikator@gmail.com",
    name: "Verifikator Demo",
    villageName: "Desa Demo Gambut",
  },
];
