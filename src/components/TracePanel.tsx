import type { SafeJevTrace, SafeLlmTrace } from "@/lib/types";

export function TracePanel({
  title,
  trace,
}: {
  title: string;
  trace: SafeLlmTrace | SafeJevTrace | null;
}) {
  return (
    <section className="min-w-0 border border-rule bg-card p-4">
      <p className="label mb-2">{title}</p>
      {trace ? (
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all bg-ink px-3 py-3 font-mono text-micro leading-5 text-paper">
          {JSON.stringify(trace, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-mute">No trace for this run.</p>
      )}
    </section>
  );
}
