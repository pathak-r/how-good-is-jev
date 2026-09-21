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
      <p className="label">Benchmark mode</p>
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
      <p className="mt-4 max-w-wide text-base text-mute">
        Both models get the same held-out {dataset.label} sample. We score exact intent match.
        We do not pick a winner.
      </p>

      <div className="mt-10 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="label mb-2 block">Sample size</span>
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
        <button type="button" onClick={() => void run()} disabled={pending} className="btn-primary">
          {pending ? "Running sample…" : "Run benchmark"}
        </button>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-mute">Advanced</summary>
        <label className="mt-3 block">
          <span className="label mb-2 block">Seed</span>
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

  const llmLabel = result.llmModelLabel ?? "LLM";

  return (
    <div className="mt-10 space-y-10">
      <section>
        <p className="max-w-measure font-display text-lg leading-snug">
          {formatRelativeSaving(result.llm.estimatedCostUsd, result.jev.estimatedCostUsd, "cost")}
          {". "}
          {formatRelativeSaving(result.llm.averageLatencyMs, result.jev.averageLatencyMs, "latency")}
          {"."}
        </p>
        <div className="mt-4 grid grid-cols-1 divide-y divide-rule border border-rule bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetricPair
            label="Exact-intent accuracy"
            llmLabel={llmLabel}
            left={formatPct(result.llm.routingAccuracy)}
            right={formatPct(result.jev.routingAccuracy)}
            leftValue={result.llm.routingAccuracy}
            rightValue={result.jev.routingAccuracy}
            max={1}
          />
          <MetricPair
            label="Average latency"
            llmLabel={llmLabel}
            left={formatMs(result.llm.averageLatencyMs)}
            right={formatMs(result.jev.averageLatencyMs)}
            leftValue={result.llm.averageLatencyMs}
            rightValue={result.jev.averageLatencyMs}
            max={maxLatency}
          />
          <MetricPair
            label="Estimated cost"
            llmLabel={llmLabel}
            left={formatUsd(result.llm.estimatedCostUsd)}
            right={formatUsd(result.jev.estimatedCostUsd)}
            leftValue={result.llm.estimatedCostUsd}
            rightValue={result.jev.estimatedCostUsd}
            max={maxCost}
          />
        </div>
        <p className="num mt-2 text-xs text-mute">
          Disagreement rate {formatPct(result.disagreementRate)} · dataset {result.datasetVersion} ·
          seed {result.seed}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricsTable title={result.llmModelLabel ?? "LLM"} metrics={result.llm} />
        <MetricsTable title="Jev" metrics={result.jev} />
      </div>

      <DomainChart rows={result.accuracyByDomain} />

      {result.disagreements.length ? (
        <div>
          <h2 className="font-display text-lg leading-tight">Disagreements</h2>
          <p className="mt-1 text-sm text-mute">Cases where the two routes differ.</p>
          <div className="mt-4 overflow-x-auto border border-rule bg-card">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule">
                  <th className="label px-4 py-3 font-normal">Utterance</th>
                  <th className="label px-4 py-3 font-normal">Gold</th>
                  <th className="label px-4 py-3 font-normal">LLM</th>
                  <th className="label px-4 py-3 font-normal">Jev</th>
                </tr>
              </thead>
              <tbody>
                {result.disagreements.slice(0, 25).map((row) => (
                  <tr key={row.id} className="border-t border-rule">
                    <td className="max-w-sm px-4 py-3">{row.utterance}</td>
                    <td className="num px-4 py-3 text-xs">{row.intent}</td>
                    <td className="num px-4 py-3 text-xs">{row.llm.route ?? "fail"}</td>
                    <td className="num px-4 py-3 text-xs">{row.jev.route ?? "fail"}</td>
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
  llmLabel,
  left,
  right,
  leftValue,
  rightValue,
  max,
}: {
  label: string;
  llmLabel: string;
  left: string;
  right: string;
  leftValue: number;
  rightValue: number;
  max: number;
}) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="label">{label}</p>
      <div className="mt-3 space-y-3">
        <ScaleBar name={llmLabel} display={left} value={leftValue} max={max} />
        <ScaleBar name="Jev" display={right} value={rightValue} max={max} />
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
    <section className="border border-rule bg-card">
      <h2 className="border-b border-rule px-5 py-3 font-display text-lg leading-none">{title}</h2>
      <dl className="divide-y divide-rule">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-5 py-2.5">
            <dt className="text-sm text-mute">{label}</dt>
            <dd className="num text-sm">{value}</dd>
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
      <h2 className="font-display text-lg leading-tight">Accuracy by domain</h2>
      <p className="mt-1 text-sm text-mute">Diagnostic only. Primary score remains exact intent match.</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.domain}>
            <div className="mb-1.5 flex justify-between gap-4 text-micro">
              <span className="text-mute">
                {row.domain.replaceAll("_", " ")} ({row.count})
              </span>
              <span className="num">
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
