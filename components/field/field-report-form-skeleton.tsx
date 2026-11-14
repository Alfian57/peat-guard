import { Skeleton } from "@/components/ui/skeleton";
import { TAG_OPTIONS } from "./field-report-options";
import {
  fieldCaptureGrid,
  fieldCaptureMapHeight,
  fieldCapturePanel,
  fieldFormActionsGrid,
  fieldFormSaveArea,
  fieldPhotoPreviewHeight,
} from "./field-report-layout";

export function FieldReportFormSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat formulir laporan"
      className="space-y-3 sm:space-y-4 motion-reduce:[&_[data-slot=skeleton]]:animate-none"
    >
      <div className={fieldCaptureGrid} aria-hidden="true">
        <div className={`flex flex-col ${fieldCapturePanel}`}>
          <Skeleton className="h-8 w-32 bg-peat-forest/15" />
          <Skeleton className="mt-1 h-5 w-full max-w-96 bg-peat-forest/10" />
          <div className="mt-3 flex flex-1 flex-col overflow-hidden rounded-xl border border-peat-forest/10">
            <Skeleton
              className={`flex-1 rounded-none bg-peat-paper ${fieldPhotoPreviewHeight}`}
            />
            <div className="grid grid-cols-2 gap-2 p-2">
              <Skeleton className="h-11 rounded-lg bg-peat-forest/10" />
              <Skeleton className="h-11 rounded-lg bg-peat-forest/10" />
            </div>
          </div>
        </div>
        <div className={fieldCapturePanel}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-20 bg-peat-forest/15" />
            <Skeleton className="h-9 w-22 rounded-lg bg-peat-forest/10" />
          </div>
          <Skeleton className="mt-1 h-5 w-full max-w-72 bg-peat-forest/10" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-8 w-full max-w-60 bg-peat-forest/10" />
            <Skeleton
              className={`rounded-xl bg-peat-paper ${fieldCaptureMapHeight}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3">
            {["Lintang", "Bujur"].map((label) => (
              <div className="space-y-1" key={label}>
                <Skeleton className="h-4 w-12 bg-peat-forest/10" />
                <Skeleton className="h-11 rounded-xl bg-peat-forest/10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={fieldCapturePanel} aria-hidden="true">
        <Skeleton className="h-8 w-36 bg-peat-forest/15" />
        <Skeleton className="mt-2 h-5 w-44 bg-peat-forest/10" />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TAG_OPTIONS.map((tag) => (
            <Skeleton
              className="h-9 rounded-full bg-peat-forest/10"
              key={tag}
              style={{ width: 24 + tag.length * 6 }}
            />
          ))}
        </div>
        <Skeleton className="mt-3 h-5 w-44 bg-peat-forest/10" />
        <Skeleton className="mt-1 h-20 rounded-xl bg-peat-forest/10" />
        <Skeleton className="mt-1 ml-auto h-4 w-10 bg-peat-forest/10" />
      </div>

      <div className={fieldFormActionsGrid} aria-hidden="true">
        <div className="min-w-0 self-center">
          <div className="flex h-7 items-center gap-2">
            <Skeleton className="size-5 shrink-0 bg-peat-forest/10" />
            <Skeleton className="size-4 shrink-0 bg-peat-forest/10" />
            <Skeleton className="h-4 w-52 bg-peat-forest/10" />
          </div>
          <Skeleton className="mt-1 ml-7 h-4 max-w-80 bg-peat-forest/10" />
        </div>
        <div
          className={`flex flex-wrap items-center justify-between gap-2 sm:gap-3 ${fieldFormSaveArea}`}
        >
          <Skeleton className="h-4 max-w-68 flex-1 basis-44 bg-peat-forest/10" />
          <Skeleton className="ml-auto h-11 w-32 rounded-xl bg-peat-forest/15" />
        </div>
      </div>
    </div>
  );
}
