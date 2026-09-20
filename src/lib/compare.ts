import { routeWithJev } from "./adapters/jev";
import { routeWithLlm } from "./adapters/llm";
import { domainLabel, getCatalog, getRecord, intentLabel } from "./catalog";
import { runtimeConfig } from "./config";
import { reserveSpend } from "./guards";
import { DEFAULT_DATASET_ID, DEFAULT_LLM_MODEL_ID, type DatasetId, type LlmModelId, llmModelOption } from "./options";
import type { CompareResponse, RouterResult, SafeJevTrace, SafeLlmTrace } from "./types";

export async function runComparison(input: {
  utterance?: string;
  exampleId?: string;
  datasetId?: DatasetId;
  llmModel?: LlmModelId;
}): Promise<CompareResponse> {
  const datasetId = input.datasetId ?? DEFAULT_DATASET_ID;
  const llmModelId = input.llmModel ?? DEFAULT_LLM_MODEL_ID;
  const catalog = getCatalog(datasetId);
  const record = input.exampleId ? getRecord(datasetId, input.exampleId) : undefined;
  const utterance = record?.utterance ?? input.utterance?.trim() ?? "";
  if (!utterance) {
    throw new Error("Provide an utterance or a dataset example id.");
  }

  const [llmSettled, jevSettled] = await Promise.allSettled([
    routeWithLlm(utterance, catalog, llmModelId),
    routeWithJev(utterance, catalog),
  ]);

  const llm =
    llmSettled.status === "fulfilled"
      ? llmSettled.value
      : {
          result: failedLlm(llmModelId, "LLM call failed to start."),
          trace: emptyLlmTrace(catalog.intentCount),
        };

  const jev =
    jevSettled.status === "fulfilled"
      ? jevSettled.value
      : {
          result: failedJev("Jev call failed to start."),
          trace: emptyJevTrace(catalog.intentCount),
        };

  reserveSpend(
    llm.result.estimatedCostUsd + jev.result.estimatedCostUsd,
    runtimeConfig().dailyCostCeilingUsd,
  );

  return {
    utterance,
    exampleId: record?.id ?? null,
    groundTruth: record
      ? {
          intent: record.intent,
          domain: domainLabel(record.domain),
          label: intentLabel(catalog, record.intent),
        }
      : null,
    openComparison: !record,
    llm: llm.result,
    jev: jev.result,
    traces: {
      llm: llm.trace,
      jev: jev.trace,
    },
    datasetId,
    datasetVersion: catalog.version,
    llmModel: llmModelId,
    llmModelLabel: llmModelOption(llmModelId).label,
    intentCount: catalog.intentCount,
  };
}

function failedLlm(llmModelId: LlmModelId, error: string): RouterResult {
  return {
    provider: "llm",
    route: null,
    valid: false,
    latencyMs: 0,
    estimatedCostUsd: 0,
    confidence: null,
    probabilities: null,
    model: llmModelOption(llmModelId).id,
    usage: { inputTokens: 0, outputTokens: 0 },
    error,
    reason: null,
  };
}

function failedJev(error: string): RouterResult {
  return {
    provider: "jev",
    route: null,
    valid: false,
    latencyMs: 0,
    estimatedCostUsd: 0,
    confidence: null,
    probabilities: null,
    model: runtimeConfig().jevModel,
    usage: { inputTokens: 0, outputTokens: 0 },
    error,
    reason: null,
  };
}

function emptyLlmTrace(intentCount: number): SafeLlmTrace {
  return {
    systemInstruction: "",
    permittedRouteCount: intentCount,
    rawResponse: null,
    validation: "start_failure",
    selectedRoute: null,
    usage: { inputTokens: 0, outputTokens: 0 },
    timingMs: 0,
  };
}

function emptyJevTrace(intentCount: number): SafeJevTrace {
  return {
    question: "",
    choiceCount: intentCount,
    selectedRoute: null,
    confidence: null,
    topProbabilities: [],
    usage: { inputTokens: 0, outputTokens: 0 },
    timingMs: 0,
  };
}
