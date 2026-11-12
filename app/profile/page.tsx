import { redirect } from "next/navigation";
import { KeyRound, UserRound } from "lucide-react";

import { PasswordChangeForm } from "@/components/profile/password-change-form";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { ProfileShell } from "@/components/profile/profile-shell";
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
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <h1 className="font-heading text-4xl leading-none font-bold text-peat-forest sm:text-5xl">
            Profil Anda
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-peat-forest/70 sm:text-base">
            Kelola informasi akun, foto profil, dan keamanan akses ruang kerja.
          </p>
        </div>

        <div className="grid gap-5">
          <section
            aria-labelledby="profile-data-title"
            className="rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#edf2e9] text-peat-green">
                <UserRound aria-hidden="true" size={18} />
              </span>
              <div>
                <h2
                  className="font-heading text-xl font-bold text-peat-forest"
                  id="profile-data-title"
                >
                  Informasi profil
                </h2>
                <p className="mt-0.5 text-xs text-peat-forest/55">
                  Kelola foto profil, nama lengkap, dan data akun Anda.
                </p>
              </div>
            </div>
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
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#f7efdc] text-[#8a6822]">
                <KeyRound aria-hidden="true" size={18} />
              </span>
              <div>
                <h2
                  className="font-heading text-xl font-bold text-peat-forest"
                  id="password-title"
                >
                  Kata sandi
                </h2>
                <p className="mt-0.5 text-xs text-peat-forest/55">
                  Gunakan kata sandi baru minimal 10 karakter.
                </p>
              </div>
            </div>
            <PasswordChangeForm />
          </section>
        </div>
      </div>
    </ProfileShell>
  );
}
