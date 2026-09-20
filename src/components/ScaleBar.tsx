export function ScaleBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const width = max > 0 ? Math.max(4, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div>
      {label ? <p className="mb-1 font-mono text-[11px] text-mute">{label}</p> : null}
      <div className="h-2 overflow-hidden rounded-full bg-rule">
        <div className="h-full rounded-full bg-ink" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
