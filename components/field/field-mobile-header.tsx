import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { GlobalSearch } from "@/components/search/global-search";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldBrand } from "./field-brand";
import {
  FieldConnectionPanel,
  type FieldConnectionProps,
} from "./field-connection-panel";

export function FieldMobileHeader({
  user,
  connection,
}: {
  user: { name: string; email: string; image?: string | null } | null;
  connection: FieldConnectionProps;
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#fbfaf6] lg:hidden">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between gap-2 px-4 sm:px-7">
        <FieldBrand compact />
        {connection.ownerStatus === "loading" ? (
          <div
            className="flex h-11 items-center gap-1"
            role="status"
            aria-label="Memeriksa sesi relawan"
          >
            <div className="grid size-11 place-items-center" aria-hidden="true">
              <Skeleton className="size-[18px] rounded-full bg-peat-forest/10 motion-reduce:animate-none" />
            </div>
            <Skeleton
              aria-hidden="true"
              className="size-9 rounded-full bg-peat-forest/10 motion-reduce:animate-none"
            />
          </div>
        ) : user && connection.ownerStatus === "authenticated" ? (
          <div className="flex shrink-0 items-center gap-1 [&_button]:min-h-11 [&_button]:min-w-11">
            <GlobalSearch variant="bare" />
            <UserAccountMenu
              compactOnMobile
              email={user.email}
              image={user.image ?? null}
              name={user.name}
              role="RELAWAN"
            />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            {connection.ownerStatus === "offline-known"
              ? "Relawan offline"
              : "Belum masuk"}
          </span>
        )}
      </div>
      <FieldConnectionPanel {...connection} />
    </header>
  );
}
