export function ScaleBar({
  value,
  max,
  name,
  display,
}: {
  value: number;
  max: number;
  name?: string;
  display?: string;
}) {
  const width = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div>
      {name ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-micro">
          <span className="text-mute">{name}</span>
          <span className="num">{display}</span>
        </div>
      ) : null}
      <div className="h-1.5 bg-rule">
        <div className="h-full bg-ink" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
