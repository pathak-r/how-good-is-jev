import { formatDirectionalDelta, formatMs, formatUsd } from "@/lib/format";
import type { RouterResult } from "@/lib/types";

export function theyAgree(llm: RouterResult, jev: RouterResult): boolean {
  return Boolean(llm.route && jev.route && llm.route === jev.route);
}

export function VerdictStrip({
  llm,
  jev,
  groundTruth,
  openComparison,
}: {
  llm: RouterResult;
  jev: RouterResult;
  groundTruth: { intent: string; domain: string; label: string } | null;
  openComparison?: boolean;
}) {
  const agree = theyAgree(llm, jev);
  const scored = Boolean(groundTruth) && !openComparison;
  const llmCorrect = groundTruth ? llm.route === groundTruth.intent : null;
  const jevCorrect = groundTruth ? jev.route === groundTruth.intent : null;

  return (
    <div className="mt-4 grid grid-cols-1 divide-y divide-rule border border-rule bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <Cell label="Agreement" value={agree ? "Agree" : "Disagree"}>
        {!scored ? (
          <span className="text-mute">No gold label for typed-in text</span>
        ) : agree ? (
          <span className={llmCorrect ? "text-good" : "text-bad"}>
            Both {llmCorrect ? "correct" : "wrong"}
          </span>
        ) : (
          <>
            <span className={llmCorrect ? "text-good" : "text-bad"}>
              LLM {llmCorrect ? "correct" : "wrong"}
            </span>
            <span className="text-mute"> · </span>
            <span className={jevCorrect ? "text-good" : "text-bad"}>
              Jev {jevCorrect ? "correct" : "wrong"}
            </span>
          </>
        )}
      </Cell>

      <Cell
        label="Cost · Jev vs LLM"
        value={formatDirectionalDelta(llm.estimatedCostUsd, jev.estimatedCostUsd, "cost")}
      >
        <span className="num">
          {formatUsd(llm.estimatedCostUsd)} → {formatUsd(jev.estimatedCostUsd)}
        </span>
      </Cell>

      <Cell
        label="Latency · Jev vs LLM"
        value={formatDirectionalDelta(llm.latencyMs, jev.latencyMs, "latency")}
      >
        <span className="num">
          {formatMs(llm.latencyMs)} → {formatMs(jev.latencyMs)}
        </span>
      </Cell>
    </div>
  );
}

function Cell({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="label">{label}</p>
      <p className="mt-2 font-display text-lg leading-none tabular-nums">{value}</p>
      <p className="mt-2 text-xs">{children}</p>
    </div>
  );
}
