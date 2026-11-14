export { MapConfigurationState } from "./map-configuration-state";

export function MapMessageState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      aria-live="polite"
      data-map-placeholder=""
      className="grid h-full min-h-72 place-items-center rounded-2xl border border-peat-forest/15 bg-white px-6 py-8 text-center"
      role="status"
    >
      <div className="max-w-sm">
        <p className="font-heading text-2xl font-bold text-peat-forest">
          {title}
        </p>
        <p className="mt-2 text-sm leading-6 text-peat-forest/75">
          {description}
        </p>
      </div>
    </div>
  );
}
