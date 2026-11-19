import { Popover } from "@base-ui/react/popover";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PublicMapInfoPopover({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={title}
        title={title}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-peat-forest/15 text-peat-forest hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green data-popup-open:bg-peat-forest/10"
      >
        <Icon aria-hidden="true" size={18} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={6} className="z-50">
          <Popover.Popup className="max-h-(--available-height) w-72 max-w-(--available-width) space-y-2 overflow-y-auto overscroll-contain rounded-xl border border-peat-forest/15 bg-white p-3 text-xs leading-5 text-peat-forest shadow-lg">
            <Popover.Title className="text-sm font-semibold">
              {title}
            </Popover.Title>
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
