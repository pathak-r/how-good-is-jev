import { TypeSafeClient, choice } from "@typesafe-ai/sdk";
import { choiceCriteria, type DatasetCatalog } from "../catalog";
import { estimateCostUsd, runtimeConfig } from "../config";
import { sanitizeError } from "../guards";
import type { RouterResult, SafeJevTrace } from "../types";

function topProbabilities(probabilities: Record<string, number> | undefined) {
  if (!probabilities) return [];
  return Object.entries(probabilities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([intent, probability]) => ({ intent, probability }));
}

export async function routeWithJev(
  utterance: string,
  catalog: DatasetCatalog,
): Promise<{
  result: RouterResult;
  trace: SafeJevTrace;
}> {
  const config = runtimeConfig();
  const started = performance.now();
  const emptyTrace: SafeJevTrace = {
    question: catalog.question,
    choiceCount: catalog.intentCount,
    selectedRoute: null,
    confidence: null,
    topProbabilities: [],
    usage: { inputTokens: 0, outputTokens: 0 },
    timingMs: 0,
  };

  if (!config.typesafeApiKey) {
    return {
      result: failed(config.jevModel, "TYPESAFE_API_KEY is not configured.", 0),
      trace: emptyTrace,
    };
  }

  try {
    const client = new TypeSafeClient({
      apiKey: config.typesafeApiKey,
      timeout: config.compareTimeoutMs,
    });
    const response = await client.systemOne(
      {
        model: config.jevModel,
        state: { utterance },
        questions: {
          intent: choice(catalog.question, choiceCriteria(catalog)),
        },
      },
      { timeout: config.compareTimeoutMs },
    );

    const latencyMs = Math.round(performance.now() - started);
    const answer = response.answers.intent;
    const route = typeof answer.choice === "string" ? answer.choice : null;
    const valid = Boolean(route && catalog.intentIds.includes(route));
    const usage = {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };

    return {
      result: {
        provider: "jev",
        route: valid ? route : null,
        valid,
        latencyMs,
        estimatedCostUsd: estimateCostUsd("jev", usage.inputTokens, usage.outputTokens),
        confidence: typeof answer.confidence === "number" ? answer.confidence : null,
        probabilities: answer.probabilities ?? null,
        model: response.model ?? config.jevModel,
        usage,
        error: valid ? null : `Jev returned a label outside the ${catalog.intentCount}-intent set.`,
        reason: null,
      },
      trace: {
        question: catalog.question,
        choiceCount: catalog.intentCount,
        selectedRoute: valid ? route : null,
        confidence: typeof answer.confidence === "number" ? answer.confidence : null,
        topProbabilities: topProbabilities(answer.probabilities as Record<string, number> | undefined),
        usage,
        timingMs: latencyMs,
      },
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    return {
      result: failed(config.jevModel, sanitizeError(error), latencyMs),
      trace: { ...emptyTrace, timingMs: latencyMs },
    };
  }
}

function failed(model: string, error: string, latencyMs: number): RouterResult {
  return {
    provider: "jev",
    route: null,
    valid: false,
    latencyMs,
    estimatedCostUsd: 0,
    confidence: null,
    probabilities: null,
    model,
    usage: { inputTokens: 0, outputTokens: 0 },
    error,
    reason: null,
  };
}
