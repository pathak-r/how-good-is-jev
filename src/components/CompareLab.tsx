"use client";

import { useState } from "react";
import { CompareMetrics, theyAgree } from "./CompareSummary";
import { ResultCard } from "./ResultCard";
import { RunConfigBar } from "./RunConfigBar";
import { TracePanel } from "./TracePanel";
import { useRunConfig } from "@/hooks/useRunConfig";
import { apiPath } from "@/lib/base-path";
import { datasetOption, llmModelOption } from "@/lib/options";
import type { CompareResponse } from "@/lib/types";

export function CompareLab() {
  const { datasetId, setDatasetId, llmModel, setLlmModel } = useRunConfig();
  const [utterance, setUtterance] = useState("");
  const [exampleId, setExampleId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [openTrace, setOpenTrace] = useState<{ llm: boolean; jev: boolean }>({
    llm: false,
    jev: false,
  });
  const dataset = datasetOption(datasetId);
  const intentCount = result?.intentCount ?? dataset.intentCount;

  async function run(payload: { utterance?: string; exampleId?: string }) {
    setPending(true);
    setError(null);
    setNotice(null);
    setResult(null);
    setOpenTrace({ llm: false, jev: false });
    try {
      const response = await fetch(apiPath("/api/compare"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, datasetId, llmModel }),
      });
      const data = (await response.json()) as CompareResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Comparison failed.");
      setResult(data);
      setUtterance(data.utterance);
      setExampleId(data.exampleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setPending(false);
    }
  }

  async function loadExample(fromDatasetId = datasetId, loadedNotice?: string) {
    setError(null);
    const response = await fetch(apiPath(`/api/example?datasetId=${fromDatasetId}`));
    const data = (await response.json()) as { id: string; utterance: string };
    setExampleId(data.id);
    setUtterance(data.utterance);
    setResult(null);
    setOpenTrace({ llm: false, jev: false });
    setNotice(loadedNotice ?? null);
  }

  const showTraces = Boolean(result && (openTrace.llm || openTrace.jev));

  return (
    <div>
      <div>
        <p className="text-xs uppercase text-mute">Compare mode</p>
        <RunConfigBar
          llmModel={llmModel}
          datasetId={datasetId}
          onLlmModel={(id) => {
            setLlmModel(id);
            setResult(null);
            setNotice(null);
          }}
          onDatasetId={(id) => {
            if (id === datasetId) return;
            setDatasetId(id);
            setResult(null);
            if (exampleId) {
              void loadExample(id, `Loaded a new ${datasetOption(id).label} example.`);
            } else {
              setNotice(null);
            }
          }}
        />
        <p className="mt-4 text-sm leading-6 text-mute">
          Each model reads one utterance and must pick one of {intentCount} labeled intents. Dataset
          examples hide the ground truth until both calls finish. Traces, latency, and a cost
          comparison are also shown.
        </p>
      </div>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          void run(exampleId ? { exampleId } : { utterance });
        }}
      >
        <label htmlFor="utterance" className="sr-only">
          User request
        </label>
        <textarea
          id="utterance"
          value={utterance}
          onChange={(event) => {
            setUtterance(event.target.value);
            setExampleId(null);
            setNotice(null);
          }}
          rows={3}
          placeholder="My card still has not arrived."
          className="w-full resize-none rounded-2xl border border-rule bg-card px-4 py-3 text-base outline-none ring-ink/10 focus:ring-2"
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending || !utterance.trim()}
            className="rounded-full bg-ink px-5 py-2 text-sm text-paper disabled:opacity-40"
          >
            {pending ? "Running…" : "Run comparison"}
          </button>
          <button
            type="button"
            onClick={() => void loadExample()}
            className="rounded-full border border-rule bg-card px-5 py-2 text-sm"
          >
            Try a dataset example from {dataset.label}
          </button>
        </div>
      </form>

      {notice ? <p className="mt-3 text-sm text-mute">{notice}</p> : null}
      {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}

      <div className="mt-8 grid items-start gap-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-rule bg-card shadow-card">
          <ResultCard
            title="Traditional LLM router"
            subtitle={`${result?.llmModelLabel ?? llmModelOption(llmModel).label} structured output`}
            result={result?.llm ?? null}
            goldIntent={result?.groundTruth?.intent}
            openComparison={result?.openComparison}
            pending={pending}
            hasTrace={Boolean(result?.traces.llm)}
            traceOpen={openTrace.llm}
            onToggleTrace={() => setOpenTrace((current) => ({ ...current, llm: !current.llm }))}
            intentCount={intentCount}
            embedded
          />
        </div>
        <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-rule bg-card shadow-card">
          <ResultCard
            title="Jev router"
            subtitle="TypeSafe System One"
            result={result?.jev ?? null}
            goldIntent={result?.groundTruth?.intent}
            openComparison={result?.openComparison}
            pending={pending}
            hasTrace={Boolean(result?.traces.jev)}
            traceOpen={openTrace.jev}
            onToggleTrace={() => setOpenTrace((current) => ({ ...current, jev: !current.jev }))}
            intentCount={intentCount}
            embedded
          />
        </div>
      </div>

      {result ? (
        <CompareMetrics llm={result.llm} jev={result.jev} llmLabel={result.llmModelLabel} />
      ) : null}

      {showTraces ? (
        <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
          {openTrace.llm ? (
            <TracePanel title="Traditional LLM trace" trace={result?.traces.llm ?? null} />
          ) : (
            <div />
          )}
          {openTrace.jev ? (
            <TracePanel title="Jev trace" trace={result?.traces.jev ?? null} />
          ) : (
            <div />
          )}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-2xl border border-dashed border-rule bg-card/70 px-5 py-4 text-center">
          <p className="text-sm font-medium">{theyAgree(result.llm, result.jev) ? "They agree" : "They disagree"}</p>
          {result.groundTruth ? (
            <>
              <p className="mt-3 text-xs uppercase text-mute">Ground truth</p>
              <p className="mt-2 font-display text-2xl font-medium">{result.groundTruth.label}</p>
              <p className="mt-1 font-mono text-xs text-mute">
                {result.groundTruth.domain} / {result.groundTruth.intent}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-mute">Open comparison — no official label for typed-in text.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
