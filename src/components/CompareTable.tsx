"use client";

import type { ReactNode } from "react";
import { ScaleBar } from "./ScaleBar";
import {
  formatRoute,
  formatUsd,
  formatUsdPerThousand,
  HUMAN_CONFIDENCE_THRESHOLD,
} from "@/lib/format";
import type { CompareResponse } from "@/lib/types";

type Props = {
  llmTitle: string;
  llmSubtitle: string;
  result: CompareResponse | null;
  pending: boolean;
  intentCount: number;
  traceOpen: { llm: boolean; jev: boolean };
  onToggleTrace: (lane: "llm" | "jev") => void;
};

const cell = "border-t border-rule px-4 py-3 sm:px-5";
const valueCell = `${cell} border-l`;

export function CompareTable({
  llmTitle,
  llmSubtitle,
  result,
  pending,
  intentCount,
  traceOpen,
  onToggleTrace,
}: Props) {
  const llm = result?.llm ?? null;
  const jev = result?.jev ?? null;
  const gold = result?.groundTruth ?? null;
  const showCorrectness = Boolean(gold && !result?.openComparison);
  const maxCost = Math.max(llm?.estimatedCostUsd ?? 0, jev?.estimatedCostUsd ?? 0);
  const maxLatency = Math.max(llm?.latencyMs ?? 0, jev?.latencyMs ?? 0);

  return (
    <section className="grid grid-cols-[5.5rem_1fr_1fr] border border-rule bg-card sm:grid-cols-[12rem_1fr_1fr]">
      <div className="px-4 py-3 sm:px-5" />
      <Header title={llmTitle} subtitle={llmSubtitle} />
      <Header title="Jev router" subtitle="TypeSafe System One" />

      {!result ? (
        <Spanning>
          {pending ? (
            <p className="text-sm text-mute">Routing this request…</p>
          ) : (
            <>
              <p className="text-sm">No request yet.</p>
              <p className="mt-1 text-sm text-mute">
                Type a request above, or load a dataset example.
              </p>
            </>
          )}
        </Spanning>
      ) : null}

      {llm && jev ? (
        <>
          <Row
            label="Route"
            llm={<Route result={llm} />}
            jev={<Route result={jev} />}
          />

          {showCorrectness ? (
            <Row
              label="Routed correctly"
              llm={<Correctness correct={llm.route === gold?.intent} />}
              jev={<Correctness correct={jev.route === gold?.intent} />}
            />
          ) : null}

          <Row
            label="Output valid"
            llm={<Validity valid={llm.valid} intentCount={intentCount} />}
            jev={<Validity valid={jev.valid} intentCount={intentCount} />}
          />

          <Row
            label="Confidence"
            llm={
              <>
                <p className="num text-sm text-mute">—</p>
                <p className="mt-1 text-xs text-mute">
                  No confidence score. The model generates JSON.
                </p>
              </>
            }
            jev={
              jev.confidence != null ? (
                <Confidence confidence={jev.confidence} />
              ) : (
                <p className="num text-sm text-mute">—</p>
              )
            }
          />

          <Row
            label="Cost"
            llm={<Cost value={llm.estimatedCostUsd} max={maxCost} />}
            jev={<Cost value={jev.estimatedCostUsd} max={maxCost} />}
          />

          <Row
            label="Latency"
            llm={<Latency value={llm.latencyMs} max={maxLatency} />}
            jev={<Latency value={jev.latencyMs} max={maxLatency} />}
          />

          <Row
            label="Model"
            llm={<p className="num text-sm text-mute">{llm.model}</p>}
            jev={<p className="num text-sm text-mute">{jev.model}</p>}
          />

          {gold ? (
            <>
              <div className={`${cell} label self-center`}>Gold label</div>
              <div className={`${valueCell} col-span-2`}>
                <p className="text-sm">{gold.label}</p>
                <p className="num mt-1 text-xs text-mute">
                  {gold.domain} / {gold.intent}
                </p>
              </div>
            </>
          ) : null}

          {result?.traces ? (
            <>
              <div className={cell} />
              <div className={valueCell}>
                <TraceToggle open={traceOpen.llm} onClick={() => onToggleTrace("llm")} />
              </div>
              <div className={valueCell}>
                <TraceToggle open={traceOpen.jev} onClick={() => onToggleTrace("jev")} />
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-l border-rule px-4 py-3 sm:px-5">
      <p className="label">{title}</p>
      <p className="num mt-1 text-xs text-mute">{subtitle}</p>
    </div>
  );
}

function Row({ label, llm, jev }: { label: string; llm: ReactNode; jev: ReactNode }) {
  return (
    <>
      <div className={`${cell} label`}>{label}</div>
      <div className={valueCell}>{llm}</div>
      <div className={valueCell}>{jev}</div>
    </>
  );
}

function Spanning({ children }: { children: ReactNode }) {
  return (
    <>
      <div className={cell} />
      <div className={`${valueCell} col-span-2`}>{children}</div>
    </>
  );
}

function Route({ result }: { result: CompareResponse["llm"] }) {
  return (
    <>
      <p className="font-display text-lg leading-tight">
        {result.route ? formatRoute(result.route) : result.error ? "Failed" : "No route"}
      </p>
      <p className="num mt-1 text-xs text-mute">{result.route ?? result.error}</p>
    </>
  );
}

function Correctness({ correct }: { correct: boolean }) {
  return <p className={`text-sm ${correct ? "text-good" : "text-bad"}`}>{correct ? "Yes" : "No"}</p>;
}

function Validity({ valid, intentCount }: { valid: boolean; intentCount: number }) {
  if (valid) return <p className="text-sm">Yes</p>;
  return (
    <>
      <p className="text-sm text-bad">No</p>
      <p className="mt-1 text-xs text-mute">
        The reply did not match the {intentCount}-intent contract.
      </p>
    </>
  );
}

function Cost({ value, max }: { value: number; max: number }) {
  return (
    <>
      <p className="font-display text-lg leading-none tabular-nums">{formatUsd(value)}</p>
      <div className="mt-3">
        <ScaleBar value={value} max={max} />
      </div>
      <p className="num mt-2 text-xs text-mute">{formatUsdPerThousand(value)} / 1k routes</p>
    </>
  );
}

function Latency({ value, max }: { value: number; max: number }) {
  return (
    <>
      <p className="font-display text-lg leading-none tabular-nums">
        {Math.round(value)}
        <span className="ml-1 text-xs text-mute">ms</span>
      </p>
      <div className="mt-3">
        <ScaleBar value={value} max={max} />
      </div>
    </>
  );
}

function Confidence({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const cutoff = Math.round(HUMAN_CONFIDENCE_THRESHOLD * 100);
  const low = confidence < HUMAN_CONFIDENCE_THRESHOLD;

  return (
    <>
      <p className={`num text-sm ${low ? "text-warn" : ""}`}>{pct}%</p>
      <div className="relative mt-2 h-1.5">
        <div className="absolute inset-0 bg-rule">
          <div
            className={`h-full ${low ? "bg-warn" : "bg-ink"}`}
            style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-paper shadow-[0_0_0_1px_rgba(27,25,20,0.4)]"
          style={{ left: `${cutoff}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-mute">Below {cutoff}% routes to a human.</p>
    </>
  );
}

function TraceToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-mute underline underline-offset-4 hover:text-ink"
    >
      {open ? "Hide trace" : "View trace"}
    </button>
  );
}
