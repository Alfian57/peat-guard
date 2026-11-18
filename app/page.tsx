import { HowItWorks } from "@/components/public/how-it-works";
import { OfflineStory } from "@/components/public/offline-story";
import { PeatlandStory } from "@/components/public/peatland-story";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHero } from "@/components/public/public-hero";
import { PublicMonitor } from "@/components/public/public-monitor";
import { SiteHeader } from "@/components/public/site-header";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { getServerSession } from "@/lib/authz";
import { getRoleHomeRoute } from "@/lib/roles";
import { APP_ROUTES } from "@/lib/routes";

export const instant = false;

export default async function Home() {
  const session = await getServerSession();
  const workspaceHref = session ? getRoleHomeRoute(session.user.role) : null;

  return (
    <>
      <a
        className="sr-only rounded-md bg-white px-4 py-3 font-semibold text-peat-forest focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60]"
        href={APP_ROUTES.homeSections.mainContent}
      >
        Lewati ke konten utama
      </a>
      <SiteHeader workspaceHref={workspaceHref} />
      <main id="main-content">
        <PublicHero />
        <PeatlandStory />
        <OfflineStory />
        <PublicMonitor />
        <HowItWorks />
      </main>
      <PublicFooter />
      <PwaInstallButton className="fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 grid size-14 place-items-center rounded-full bg-peat-sun text-peat-forest shadow-lg ring-1 shadow-black/25 ring-white/50 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-75 motion-reduce:transition-none sm:bottom-[calc(4rem+env(safe-area-inset-bottom))]" />
    </>
  );
}
