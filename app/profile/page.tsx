import { redirect } from "next/navigation";
import { Camera, KeyRound, Leaf, UserRound } from "lucide-react";
import Link from "next/link";

import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { PasswordChangeForm } from "@/components/profile/password-change-form";
import { ProfileAvatarForm } from "@/components/profile/profile-avatar-form";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { GlobalSearch } from "@/components/search/global-search";
import { getServerSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getRoleHomeRoute, isAppRole, ROLE_LABELS } from "@/lib/roles";
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
    <div className="min-h-dvh bg-[#f5f6f0]">
      <header className="border-b border-peat-forest/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.5rem] max-w-5xl items-center justify-between gap-3 px-4 sm:px-7">
          <Link
            aria-label="Kembali ke ruang kerja"
            className="flex items-center gap-2.5 rounded-md text-peat-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-green"
            href={getRoleHomeRoute(user.role)}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-peat-forest text-white">
              <Leaf aria-hidden="true" size={19} />
            </span>
            <span className="font-heading text-xl font-bold tracking-wide">
              PEATGUARD
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <UserAccountMenu
              email={user.email}
              image={user.image}
              name={user.name}
              role={user.role}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-7 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] text-peat-green">
            AKUN PEATGUARD
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-peat-forest sm:text-5xl">
            Profil Anda
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-peat-forest/65">
            Kelola informasi akun, foto profil, dan keamanan akses ruang kerja.
          </p>
        </div>

        <div className="grid gap-5">
          <section
            aria-labelledby="profile-photo-title"
            className="rounded-[1.6rem] border border-peat-forest/10 bg-white p-5 shadow-[0_12px_35px_rgba(28,53,42,0.05)] sm:p-7"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#edf2e9] text-peat-green">
                <Camera aria-hidden="true" size={18} />
              </span>
              <div>
                <h2
                  className="font-heading text-xl font-bold text-peat-forest"
                  id="profile-photo-title"
                >
                  Foto profil
                </h2>
                <p className="mt-0.5 text-xs text-peat-forest/55">
                  Foto ini hanya ditampilkan kepada akun yang sedang masuk.
                </p>
              </div>
            </div>
            <ProfileAvatarForm image={user.image} name={user.name} />
          </section>

          <section
            aria-labelledby="profile-data-title"
            className="rounded-[1.6rem] border border-peat-forest/10 bg-white p-5 shadow-[0_12px_35px_rgba(28,53,42,0.05)] sm:p-7"
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
                  Email dan peran dikelola oleh administrator.
                </p>
              </div>
            </div>
            <ProfileDetailsForm
              canEditVillage={user.role === "RELAWAN"}
              email={user.email}
              name={user.name}
              roleLabel={ROLE_LABELS[user.role]}
              villageName={user.villageName}
            />
          </section>

          <section
            aria-labelledby="password-title"
            className="rounded-[1.6rem] border border-peat-forest/10 bg-white p-5 shadow-[0_12px_35px_rgba(28,53,42,0.05)] sm:p-7"
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
      </main>
    </div>
  );
}
