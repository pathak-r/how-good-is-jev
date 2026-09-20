"use client";

import { HUMAN_CONFIDENCE_THRESHOLD } from "@/lib/format";
import type { RouterResult } from "@/lib/types";

function pretty(value: string): string {
  return value.replaceAll("_", " ");
}

type Props = {
  title: string;
  subtitle: string;
  result: RouterResult | null;
  goldIntent?: string | null;
  openComparison?: boolean;
  pending?: boolean;
  hasTrace?: boolean;
  traceOpen?: boolean;
  onToggleTrace?: () => void;
  embedded?: boolean;
  intentCount?: number;
};

export function ResultCard({
  title,
  subtitle,
  result,
  goldIntent,
  openComparison,
  pending,
  hasTrace,
  traceOpen,
  onToggleTrace,
  embedded,
  intentCount = 150,
}: Props) {
  const correct =
    result && goldIntent && result.route ? result.route === goldIntent : null;

  return (
    <article
      className={
        embedded
          ? "flex min-w-0 flex-col p-5"
          : "flex h-full min-w-0 flex-col rounded-2xl border border-rule bg-card p-5 shadow-card"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-medium leading-tight">{title}</p>
          <p className="mt-1 font-mono text-xs text-mute">{subtitle}</p>
        </div>
        {result ? (
          <StatusPill
            label={
              result.error
                ? "Failed"
                : openComparison
                  ? "Open"
                  : correct === null
                    ? result.valid
                      ? "Valid"
                      : "Invalid"
                    : correct
                      ? "Correct"
                      : "Wrong"
            }
            tone={
              result.error || correct === false
                ? "bad"
                : correct
                  ? "good"
                  : "neutral"
            }
          />
        ) : null}
      </div>

      <div className="mt-6 min-h-[4.5rem]">
        {pending ? (
          <p className="font-mono text-sm text-mute">Routing this request…</p>
        ) : result ? (
          <>
            <p className="font-display text-3xl font-medium leading-tight">
              {result.route ? pretty(result.route) : "No route"}
            </p>
            <p className="mt-2 font-mono text-xs text-mute">{result.route ?? result.error}</p>
          </>
        ) : (
          <>
            <p className="text-sm">No request yet</p>
            <p className="mt-1 text-sm text-mute">Type a request above, or try a dataset example.</p>
          </>
        )}
      </div>

      {result || pending ? <DecisionBlock result={result} intentCount={intentCount} /> : <div className="flex-1" />}

      {result || pending ? (
        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-rule pt-4 font-mono text-xs">
          <Metric label="Model" value={result?.model ?? "—"} />
          <Metric
            label="Output valid"
            value={result ? (result.valid ? "Yes" : "No") : "—"}
          />
        </dl>
      ) : null}

      {hasTrace ? (
        <button
          type="button"
          onClick={onToggleTrace}
          className="mt-4 self-start text-xs text-mute underline-offset-2 hover:underline"
        >
          {traceOpen ? "Hide trace" : "View trace"}
        </button>
      ) : null}
    </article>
  );
}

function DecisionBlock({ result, intentCount }: { result: RouterResult | null; intentCount: number }) {
  if (!result) {
    return <div className="mt-5 min-h-[5.5rem] rounded-xl border border-transparent" />;
  }

  if (result.provider === "jev" && result.confidence != null) {
    const pct = Math.round(result.confidence * 100);
    const cutoff = Math.round(HUMAN_CONFIDENCE_THRESHOLD * 100);
    const low = result.confidence < HUMAN_CONFIDENCE_THRESHOLD;
    return (
      <div className={`mt-5 rounded-xl border px-3 py-3 ${low ? "border-warn/40 bg-warn/5" : "border-rule"}`}>
        <div className="mb-2 flex items-center justify-between font-mono text-[11px]">
          <span className="text-mute">Confidence</span>
          <span>{pct}%</span>
        </div>
        <div className="relative h-2">
          <div className="absolute inset-0 overflow-hidden rounded-full bg-rule">
            <div
              className={`h-full rounded-full ${low ? "bg-warn" : "bg-ink"}`}
              style={{ width: `${Math.max(3, Math.min(100, pct))}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 z-10 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-paper shadow-[0_0_0_1px_rgba(27,25,20,0.35)]"
            style={{ left: `${cutoff}%` }}
            title={`${cutoff}% cutoff`}
          />
        </div>
        <p className="mt-2 text-xs leading-5">
          {low
            ? `Routes to a human (below ${cutoff}%).`
            : `Auto-route to the chosen intent. Routes to a human below ${cutoff}%.`}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mt-5 rounded-xl border px-3 py-3 ${
        result.valid ? "border-rule" : "border-bad/40 bg-bad/5"
      }`}
    >
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="text-mute">Structured output</span>
        <span className={result.valid ? undefined : "text-bad"}>{result.valid ? "Valid" : "Invalid"}</span>
      </div>
      <p className="mt-2 text-xs leading-5">
        {result.valid
          ? `No confidence score. Valid means the label is in the ${intentCount}-intent set.`
          : `The reply did not match the ${intentCount}-intent contract.`}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-mute">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "good" | "bad" | "neutral" }) {
  const color =
    tone === "good" ? "text-good border-good/30" : tone === "bad" ? "text-bad border-bad/30" : "text-mute border-rule";
  return <span className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${color}`}>{label}</span>;
}
