import { HowItWorks } from "@/components/public/how-it-works";
import { OfflineStory } from "@/components/public/offline-story";
import { PeatlandStory } from "@/components/public/peatland-story";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHero } from "@/components/public/public-hero";
import { PublicMonitor } from "@/components/public/public-monitor";
import { SiteHeader } from "@/components/public/site-header";
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
    </>
  );
}
