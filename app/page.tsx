import { HowItWorks } from "@/components/public/how-it-works";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHero } from "@/components/public/public-hero";
import { PublicMonitor } from "@/components/public/public-monitor";

export default function Home() {
  return (
    <>
      <a
        className="sr-only rounded-md bg-white px-4 py-3 font-semibold text-peat-forest focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
        href="#main-content"
      >
        Lewati ke konten utama
      </a>
      <main id="main-content">
        <PublicHero />
        <PublicMonitor />
        <HowItWorks />
      </main>
      <PublicFooter />
    </>
  );
}
