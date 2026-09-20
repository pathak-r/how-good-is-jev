import type { SafeJevTrace, SafeLlmTrace } from "@/lib/types";

export function TracePanel({
  title,
  trace,
}: {
  title: string;
  trace: SafeLlmTrace | SafeJevTrace | null;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-rule bg-card p-4">
      <p className="mb-2 text-xs uppercase text-mute">{title}</p>
      {trace ? (
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-ink px-3 py-3 font-mono text-[11px] leading-5 text-paper">
          {JSON.stringify(trace, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-mute">No trace for this run.</p>
      )}
    </section>
  );
}
