export function ReportTextList({
  heading,
  values,
}: {
  heading: string;
  values: string[];
}) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-peat-forest">{heading}</h3>
      <ul className="mt-2 space-y-2">
        {values.map((value, index) => (
          <li
            className="flex gap-2 text-sm leading-6 wrap-anywhere text-peat-forest/80"
            key={index}
          >
            <span aria-hidden="true" className="font-semibold text-peat-green">
              {index + 1}.
            </span>
            <span className="min-w-0">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ReportTextList as TextList };
