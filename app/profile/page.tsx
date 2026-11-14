import { redirect } from "next/navigation";
import { KeyRound, UserRound } from "lucide-react";

import { PasswordChangeForm } from "@/components/profile/password-change-form";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { ProfileShell } from "@/components/profile/profile-shell";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { getServerSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { isAppRole } from "@/lib/roles";
import { APP_ROUTES } from "@/lib/routes";

export const instant = false;

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) redirect(APP_ROUTES.login);
  if (!isAppRole(session.user.role)) redirect(APP_ROUTES.home);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      villageName: true,
      image: true,
    },
  });
  if (!user) redirect(APP_ROUTES.login);
  if (!isAppRole(user.role)) redirect(APP_ROUTES.home);

  return (
    <ProfileShell
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }}
    >
      <div className="w-full min-w-0">
        <WorkspacePageHeading
          title="Profil Anda"
          description="Kelola informasi akun, foto profil, dan keamanan akses ruang kerja."
        />

        <div className="grid max-w-4xl gap-5">
          <section
            aria-labelledby="profile-data-title"
            className="rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#edf2e9] text-peat-green">
                <UserRound aria-hidden="true" size={18} />
              </span>
              <h2
                className="font-heading text-xl font-bold text-peat-forest"
                id="profile-data-title"
              >
                Informasi profil
              </h2>
            </div>
            <p className="mt-3 mb-5 text-sm leading-6 text-muted-foreground">
              Kelola foto profil, nama lengkap, dan data akun Anda.
            </p>
            <ProfileDetailsForm
              canEditVillage={user.role === "RELAWAN"}
              email={user.email}
              image={user.image}
              name={user.name}
              villageName={user.villageName}
            />
          </section>

          <section
            aria-labelledby="password-title"
            className="rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#f7efdc] text-[#8a6822]">
                <KeyRound aria-hidden="true" size={18} />
              </span>
              <h2
                className="font-heading text-xl font-bold text-peat-forest"
                id="password-title"
              >
                Kata sandi
              </h2>
            </div>
            <p className="mt-3 mb-5 text-sm leading-6 text-muted-foreground">
              Gunakan kata sandi baru minimal 10 karakter.
            </p>
            <PasswordChangeForm />
          </section>
        </div>
      </div>
    </ProfileShell>
  );
}
