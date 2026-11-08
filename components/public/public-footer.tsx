import Link from "next/link";
import { Leaf } from "lucide-react";
import { APP_ROUTES } from "@/lib/routes";

const CURRENT_YEAR = 2026;

export function PublicFooter() {
  return (
    <footer className="bg-[#173b2f] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-2 font-heading text-xl font-bold tracking-wide"
            href={APP_ROUTES.home}
          >
            <Leaf aria-hidden="true" size={19} />
            PEATGUARD
          </Link>
          <p className="mt-2 max-w-lg text-xs leading-5 text-white/65">
            WebGIS untuk pencegahan karhutla gambut dan transparansi dampak
            konservasi.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
          <a className="hover:text-white" href="#peta-publik">
            Peta pantauan
          </a>
          <Link className="hover:text-white" href={APP_ROUTES.login}>
            Masuk
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/55 sm:px-8">
        © {CURRENT_YEAR} PEATGUARD · Data ilustrasi diberi label secara terbuka.
      </div>
    </footer>
  );
}
