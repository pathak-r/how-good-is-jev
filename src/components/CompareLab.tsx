"use client";

import { useState } from "react";
import { VerdictStrip } from "./CompareSummary";
import { CompareTable } from "./CompareTable";
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
      <p className="label">Compare mode</p>
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
      <p className="mt-4 max-w-wide text-base text-mute">
        Each router reads the same request and must pick one of {intentCount} labeled intents. When
        the request comes from the dataset, the gold label is shown once both calls finish.
      </p>

      <form
        className="mt-10"
        onSubmit={(event) => {
          event.preventDefault();
          void run(exampleId ? { exampleId } : { utterance });
        }}
      >
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="utterance" className="label">
            User request
          </label>
          {exampleId ? (
            <p className="num text-micro text-mute">
              {dataset.label} · {exampleId}
            </p>
          ) : null}
        </div>
        <textarea
          id="utterance"
          value={utterance}
          onChange={(event) => {
            setUtterance(event.target.value);
            setExampleId(null);
            setNotice(null);
          }}
          rows={2}
          placeholder="My card still has not arrived."
          className="mt-2 w-full resize-none border border-rule bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ink/15"
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="submit" disabled={pending || !utterance.trim()} className="btn-primary">
            {pending ? "Running…" : "Run comparison"}
          </button>
          <button type="button" onClick={() => void loadExample()} className="btn-secondary">
            Try an example
          </button>
        </div>
      </form>

      {notice ? <p className="mt-3 text-sm text-mute">{notice}</p> : null}
      {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}

      <div className="mt-10">
        <CompareTable
          llmTitle="Traditional LLM router"
          llmSubtitle={`${result?.llmModelLabel ?? llmModelOption(llmModel).label} structured output`}
          result={result}
          pending={pending}
          intentCount={intentCount}
          traceOpen={openTrace}
          onToggleTrace={(lane) =>
            setOpenTrace((current) => ({ ...current, [lane]: !current[lane] }))
          }
        />

        {result ? (
          <VerdictStrip
            llm={result.llm}
            jev={result.jev}
            groundTruth={result.groundTruth}
            openComparison={result.openComparison}
          />
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
      </div>
    </div>
  );
}
