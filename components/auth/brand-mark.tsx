import { Leaf } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-[#c5dc8c] backdrop-blur-sm">
        <Leaf aria-hidden="true" size={22} />
      </span>
      <span className="font-heading text-2xl leading-none font-bold tracking-[0.12em]">
        PEATGUARD
      </span>
    </div>
  );
}
