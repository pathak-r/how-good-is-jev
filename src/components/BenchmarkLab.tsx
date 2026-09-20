"use client";

import { useState } from "react";
import { RunConfigBar } from "./RunConfigBar";
import { ScaleBar } from "./ScaleBar";
import { useRunConfig } from "@/hooks/useRunConfig";
import { formatMs, formatPct, formatRelativeSaving, formatUsd } from "@/lib/format";
import { apiPath } from "@/lib/base-path";
import { datasetOption } from "@/lib/options";
import type { BenchmarkMetrics } from "@/lib/types";

const SIZES = [25, 50, 100] as const;

export function BenchmarkLab() {
  const { datasetId, setDatasetId, llmModel, setLlmModel } = useRunConfig();
  const [size, setSize] = useState<(typeof SIZES)[number]>(25);
  const [seed, setSeed] = useState(150);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BenchmarkMetrics | null>(null);
  const dataset = datasetOption(datasetId);

  async function run() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(apiPath("/api/benchmark"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ size, seed, datasetId, llmModel }),
      });
      const data = (await response.json()) as BenchmarkMetrics & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Benchmark failed.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Benchmark failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <p className="text-xs uppercase text-mute">Benchmark mode</p>
      <RunConfigBar
        llmModel={llmModel}
        datasetId={datasetId}
        onLlmModel={(id) => {
          setLlmModel(id);
          setResult(null);
        }}
        onDatasetId={(id) => {
          setDatasetId(id);
          setResult(null);
        }}
      />
      <p className="mt-4 text-sm leading-6 text-mute">
        Both models get the same held-out {dataset.label} sample. We score exact intent match.
        We do not pick a winner.
      </p>

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-mute">Sample size</span>
          <select
            value={size}
            onChange={(event) => setSize(Number(event.target.value) as (typeof SIZES)[number])}
            className="field"
          >
            {SIZES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void run()}
          disabled={pending}
          className="h-11 rounded-full bg-ink px-5 text-sm text-paper disabled:opacity-40"
        >
          {pending ? "Running sample…" : "Run benchmark"}
        </button>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-mute">Advanced</summary>
        <label className="mt-3 block">
          <span className="mb-1 block text-mute">Seed</span>
          <input
            type="number"
            value={seed}
            onChange={(event) => setSeed(Number(event.target.value))}
            className="field"
          />
          <span className="mt-2 block text-sm text-mute">
            Same seed, same sample. Change it only if you want a different draw.
          </span>
        </label>
      </details>

      {error ? <p className="mt-4 text-sm text-bad">{error}</p> : null}

      {result ? <BenchmarkResults result={result} /> : null}
    </div>
  );
}

function BenchmarkResults({ result }: { result: BenchmarkMetrics }) {
  const maxLatency = Math.max(result.llm.averageLatencyMs, result.jev.averageLatencyMs, 1);
  const maxCost = Math.max(result.llm.estimatedCostUsd, result.jev.estimatedCostUsd, 0);

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-2xl border border-rule bg-card p-5 shadow-card">
        <p className="text-sm font-medium">
          {formatRelativeSaving(result.llm.estimatedCostUsd, result.jev.estimatedCostUsd, "cost")}
          {" · "}
          {formatRelativeSaving(result.llm.averageLatencyMs, result.jev.averageLatencyMs, "latency")}
        </p>
        <p className="mt-2 font-mono text-xs text-mute">
          Disagreement rate {formatPct(result.disagreementRate)} · dataset {result.datasetVersion} ·
          seed {result.seed}
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <MetricPair
            label="Exact-intent accuracy"
            left={`${result.llmModelLabel ?? "LLM"}  ${formatPct(result.llm.routingAccuracy)}`}
            right={`Jev  ${formatPct(result.jev.routingAccuracy)}`}
            leftValue={result.llm.routingAccuracy}
            rightValue={result.jev.routingAccuracy}
            max={1}
          />
          <MetricPair
            label="Average latency"
            left={`${result.llmModelLabel ?? "LLM"}  ${formatMs(result.llm.averageLatencyMs)}`}
            right={`Jev  ${formatMs(result.jev.averageLatencyMs)}`}
            leftValue={result.llm.averageLatencyMs}
            rightValue={result.jev.averageLatencyMs}
            max={maxLatency}
          />
          <MetricPair
            label="Estimated cost"
            left={`${result.llmModelLabel ?? "LLM"}  ${formatUsd(result.llm.estimatedCostUsd)}`}
            right={`Jev  ${formatUsd(result.jev.estimatedCostUsd)}`}
            leftValue={result.llm.estimatedCostUsd}
            rightValue={result.jev.estimatedCostUsd}
            max={maxCost}
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricsTable title={result.llmModelLabel ?? "LLM"} metrics={result.llm} />
        <MetricsTable title="Jev" metrics={result.jev} />
      </div>

      <DomainChart rows={result.accuracyByDomain} />

      {result.disagreements.length ? (
        <div>
          <h2 className="font-display text-2xl font-medium">Disagreements</h2>
          <p className="mt-1 text-sm text-mute">Cases where the two routes differ.</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-rule font-mono text-xs text-mute">
                <tr>
                  <th className="px-4 py-3">Utterance</th>
                  <th className="px-4 py-3">Gold</th>
                  <th className="px-4 py-3">LLM</th>
                  <th className="px-4 py-3">Jev</th>
                </tr>
              </thead>
              <tbody>
                {result.disagreements.slice(0, 25).map((row) => (
                  <tr key={row.id} className="border-t border-rule/70">
                    <td className="max-w-sm px-4 py-3">{row.utterance}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.intent}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.llm.route ?? "fail"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.jev.route ?? "fail"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricPair({
  label,
  left,
  right,
  leftValue,
  rightValue,
  max,
}: {
  label: string;
  left: string;
  right: string;
  leftValue: number;
  rightValue: number;
  max: number;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-mute">{label}</p>
      <div className="space-y-2">
        <ScaleBar label={left} value={leftValue} max={max} />
        <ScaleBar label={right} value={rightValue} max={max} />
      </div>
    </div>
  );
}

function MetricsTable({
  title,
  metrics,
}: {
  title: string;
  metrics: BenchmarkMetrics["llm"];
}) {
  const rows = [
    ["Exact-intent accuracy", formatPct(metrics.routingAccuracy)],
    ["Average latency", formatMs(metrics.averageLatencyMs)],
    ["p95 latency", formatMs(metrics.p95LatencyMs)],
    ["Estimated cost", formatUsd(metrics.estimatedCostUsd)],
    ["Output validity", formatPct(metrics.outputValidity)],
    ["Failed calls", String(metrics.failed)],
  ];
  return (
    <section className="rounded-2xl border border-rule bg-card p-5 shadow-card">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      <dl className="mt-4 space-y-2 font-mono text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-mute">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DomainChart({
  rows,
}: {
  rows: BenchmarkMetrics["accuracyByDomain"];
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-medium">Accuracy by domain</h2>
      <p className="mt-1 text-sm text-mute">Diagnostic only. Primary score remains exact intent match.</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.domain}>
            <div className="mb-1 flex justify-between font-mono text-xs text-mute">
              <span>
                {row.domain.replaceAll("_", " ")} ({row.count})
              </span>
              <span>
                LLM {formatPct(row.llmAccuracy)} · Jev {formatPct(row.jevAccuracy)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ScaleBar value={row.llmAccuracy} max={1} />
              <ScaleBar value={row.jevAccuracy} max={1} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
