"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/roles";
import { BrandMark } from "@/components/auth/brand-mark";
import { API_ROUTES, APP_ROUTES } from "@/lib/routes";

const demoRoleIcons = {
  RELAWAN: MapPin,
  POSKO: UsersRound,
  VERIFIKATOR: ShieldCheck,
} satisfies Record<AppRole, typeof MapPin>;

type LoginFormProps = {
  demoEnabled: boolean;
};

export function LoginForm({ demoEnabled }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<AppRole | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const values = new FormData(event.currentTarget);
    const email = values.get("email");
    const password = values.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
      setErrorMessage("Masukkan email dan kata sandi yang valid.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setErrorMessage("Email atau kata sandi belum cocok.");
        return;
      }

      router.replace(APP_ROUTES.home);
      router.refresh();
    } catch {
      setErrorMessage("Kami belum dapat memproses masuk. Coba lagi sebentar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInAsDemo(role: AppRole) {
    setErrorMessage(null);
    setActiveDemoRole(role);

    try {
      const response = await fetch(API_ROUTES.auth.demo, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        setErrorMessage(
          "Mode demo belum siap. Pastikan seed lokal sudah dijalankan.",
        );
        return;
      }

      router.replace(APP_ROUTES.home);
      router.refresh();
    } catch {
      setErrorMessage("Mode demo belum dapat dihubungi. Coba lagi sebentar.");
    } finally {
      setActiveDemoRole(null);
    }
  }

  const isBusy = isSubmitting || activeDemoRole !== null;

  return (
    <main className="grid min-h-[100dvh] flex-1 bg-peat-forest lg:grid-cols-2 lg:gap-5 lg:p-5">
      <section
        aria-label="Patroli perlindungan gambut"
        className="relative hidden min-h-[calc(100dvh-2.5rem)] overflow-hidden rounded-3xl lg:flex"
      >
        <Image
          src="/images/peatland-patrol-hero.png"
          alt="Petugas patroli memeriksa sekat kanal di lahan gambut"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#102d24]/95 via-[#102d24]/20 to-[#102d24]/40" />
        <div className="relative z-10 flex w-full flex-col justify-between p-10 text-white xl:p-14">
          <BrandMark />
          <div className="max-w-xl pb-4">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-[#d6e5c4] uppercase">
              <span className="h-px w-8 bg-[#9bb85a]" />
              Menjaga gambut, bersama
            </p>
            <h1 className="font-heading text-6xl leading-[0.95] font-bold tracking-wide text-balance xl:text-7xl">
              Satu temuan.
              <br />
              Banyak kehidupan.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/85">
              Hubungkan patroli lapangan, respons posko, dan dampak perlindungan
              gambut dalam satu ruang kerja.
            </p>
          </div>
          <p className="text-xs text-white/75">
            Data ilustratif PEATGUARD untuk demonstrasi alur kerja.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] flex-col lg:min-h-0 lg:justify-center lg:rounded-3xl lg:bg-peat-paper lg:px-8 lg:py-10 xl:px-16">
        <div className="relative h-[18rem] shrink-0 overflow-hidden sm:h-[21rem] lg:hidden">
          <Image
            src="/images/peatland-patrol-mobile.png"
            alt="Petugas patroli memeriksa kondisi kanal gambut"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-peat-forest/85 via-peat-forest/15 to-peat-forest/20" />
          <div className="absolute inset-x-0 top-0 p-6 text-white sm:p-8">
            <BrandMark />
            <h1 className="mt-7 max-w-sm font-heading text-4xl leading-none font-bold tracking-wide text-balance sm:text-5xl">
              Satu temuan. Banyak kehidupan.
            </h1>
          </div>
        </div>

        <div className="relative -mt-6 flex flex-1 flex-col rounded-t-3xl bg-peat-paper px-5 pt-8 pb-8 sm:px-8 lg:mx-auto lg:mt-0 lg:w-full lg:max-w-[31rem] lg:rounded-none lg:px-0 lg:py-0">
          <div className="mb-7 lg:mb-8">
            <p className="text-sm font-semibold tracking-[0.14em] text-peat-green uppercase">
              Ruang kerja PEATGUARD
            </p>
            <h2 className="mt-2 font-heading text-4xl leading-tight font-bold text-peat-forest sm:text-[2.75rem]">
              Selamat datang kembali
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Masuk untuk melanjutkan perlindungan gambut bersama tim Anda.
            </p>
          </div>

          <form className="space-y-4" onSubmit={submitCredentials}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nama@organisasi.id"
                required
                disabled={isBusy}
                className="h-12 w-full rounded-xl border border-border bg-white px-4 text-base transition outline-none placeholder:text-muted-foreground/75 focus-visible:border-peat-green focus-visible:ring-3 focus-visible:ring-peat-green/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-foreground"
              >
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={isBusy}
                  className="h-12 w-full rounded-xl border border-border bg-white px-4 pr-12 text-base transition outline-none focus-visible:border-peat-green focus-visible:ring-3 focus-visible:ring-peat-green/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-1 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition hover:text-peat-forest"
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isBusy}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={18} />
                  ) : (
                    <Eye aria-hidden="true" size={18} />
                  )}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <p
                className="rounded-lg border border-critical/25 bg-critical/5 px-3 py-2 text-sm text-critical"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white transition hover:bg-peat-green focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-peat-green disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
            >
              {isSubmitting ? (
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                  size={18}
                />
              ) : null}
              {isSubmitting ? "Memeriksa akun…" : "Masuk"}
            </button>
          </form>

          {demoEnabled ? (
            <div className="mt-7">
              <div className="relative mb-5 flex items-center justify-center">
                <span className="h-px flex-1 bg-border" />
                <span className="px-3 text-xs font-medium text-muted-foreground">
                  atau coba akun demo
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2.5">
                {APP_ROLES.map((role) => {
                  const Icon = demoRoleIcons[role];
                  const isActive = activeDemoRole === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-white px-4 py-2 text-left transition hover:border-peat-green hover:bg-[#f0f5e9] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => void signInAsDemo(role)}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e9efdf] text-peat-forest">
                        {isActive ? (
                          <LoaderCircle
                            className="animate-spin"
                            aria-hidden="true"
                            size={18}
                          />
                        ) : (
                          <Icon aria-hidden="true" size={18} />
                        )}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-foreground">
                        {ROLE_LABELS[role]}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-lg leading-none text-peat-green"
                      >
                        ›
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck aria-hidden="true" size={14} />
                Mode demo menggunakan data ilustratif.
              </p>
            </div>
          ) : null}

          <p className="mt-auto pt-8 text-center text-xs leading-5 text-muted-foreground lg:mt-8">
            Akses diberikan oleh administrator organisasi. Pendaftaran mandiri
            tidak tersedia.
          </p>
        </div>
      </section>
    </main>
  );
}
