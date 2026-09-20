import { formatMs, formatRelativeSaving, formatUsd } from "@/lib/format";
import { ScaleBar } from "./ScaleBar";
import type { RouterResult } from "@/lib/types";

export function theyAgree(llm: RouterResult, jev: RouterResult): boolean {
  return llm.route && jev.route ? llm.route === jev.route : llm.route === jev.route && !llm.error && !jev.error;
}

export function CompareMetrics({
  llm,
  jev,
  llmLabel = "GPT-4.1",
}: {
  llm: RouterResult;
  jev: RouterResult;
  llmLabel?: string;
}) {
  const maxCost = Math.max(llm.estimatedCostUsd, jev.estimatedCostUsd, 0);
  const maxLatency = Math.max(llm.latencyMs, jev.latencyMs, 0);

  return (
    <div className="mt-4 grid gap-6 rounded-2xl border border-rule bg-card px-5 py-4 shadow-card md:grid-cols-2 md:gap-0 md:divide-x md:divide-rule">
      <section className="md:pr-5">
        <p className="text-xs uppercase text-mute">Cost</p>
        <p className="mt-1 text-sm font-medium">
          {formatRelativeSaving(llm.estimatedCostUsd, jev.estimatedCostUsd, "cost")}
        </p>
        <div className="mt-3 space-y-2">
          <ScaleBar label={`${llmLabel}  ${formatUsd(llm.estimatedCostUsd)}`} value={llm.estimatedCostUsd} max={maxCost} />
          <ScaleBar label={`Jev  ${formatUsd(jev.estimatedCostUsd)}`} value={jev.estimatedCostUsd} max={maxCost} />
        </div>
      </section>
      <section className="md:pl-5">
        <p className="text-xs uppercase text-mute">Latency</p>
        <p className="mt-1 text-sm font-medium">
          {formatRelativeSaving(llm.latencyMs, jev.latencyMs, "latency")}
        </p>
        <div className="mt-3 space-y-2">
          <ScaleBar label={`${llmLabel}  ${formatMs(llm.latencyMs)}`} value={llm.latencyMs} max={maxLatency} />
          <ScaleBar label={`Jev  ${formatMs(jev.latencyMs)}`} value={jev.latencyMs} max={maxLatency} />
        </div>
      </section>
    </div>
  );
}
