import OpenAI from "openai";
import { estimateCostUsd, runtimeConfig } from "../config";
import { sanitizeError } from "../guards";
import type { DatasetCatalog } from "../catalog";
import { llmModelOption, type LlmModelId } from "../options";
import type { RouterResult, SafeLlmTrace } from "../types";

function systemInstruction(catalog: DatasetCatalog): string {
  return [
    "You are an intent router for a virtual assistant.",
    `Read the user utterance and select exactly one canonical ${catalog.label} intent.`,
    "You must choose from the provided enum only.",
    "Do not invent new labels. Do not return a domain instead of an intent.",
  ].join(" ");
}

function intentList(catalog: DatasetCatalog): string {
  return catalog.intents.map((intent) => `${intent.id}: ${intent.description}`).join("\n");
}

function schema(catalog: DatasetCatalog) {
  return {
    type: "json_schema" as const,
    json_schema: {
      name: "route_decision",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          route: { type: "string", enum: catalog.intentIds },
          reason: { type: "string" },
        },
        required: ["route", "reason"],
      },
    },
  };
}

export async function routeWithLlm(
  utterance: string,
  catalog: DatasetCatalog,
  llmModelId: LlmModelId,
): Promise<{
  result: RouterResult;
  trace: SafeLlmTrace;
}> {
  const config = runtimeConfig();
  const model = llmModelOption(llmModelId);
  const instruction = systemInstruction(catalog);
  const started = performance.now();
  const emptyTrace: SafeLlmTrace = {
    systemInstruction: instruction,
    permittedRouteCount: catalog.intentCount,
    rawResponse: null,
    validation: "not_run",
    selectedRoute: null,
    usage: { inputTokens: 0, outputTokens: 0 },
    timingMs: 0,
  };

  if (!config.openaiApiKey) {
    return {
      result: failed(model.id, "OPENAI_API_KEY is not configured.", 0),
      trace: { ...emptyTrace, validation: "missing_key" },
    };
  }

  try {
    const client = new OpenAI({
      apiKey: config.openaiApiKey,
      timeout: config.compareTimeoutMs,
    });
    const completion = await client.chat.completions.create({
      model: model.id,
      messages: [
        { role: "system", content: `${instruction}\n\nAllowed intents:\n${intentList(catalog)}` },
        { role: "user", content: utterance },
      ],
      response_format: schema(catalog),
      ...(model.temperature == null ? {} : { temperature: model.temperature }),
      ...(model.reasoningEffort
        ? { reasoning_effort: model.reasoningEffort as "low" }
        : {}),
    });

    const latencyMs = Math.round(performance.now() - started);
    const usage = {
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
    };
    const content = completion.choices[0]?.message?.content ?? "";
    let parsed: { route?: string; reason?: string } = {};
    let validation = "ok";
    try {
      parsed = JSON.parse(content) as { route?: string; reason?: string };
    } catch {
      validation = "invalid_json";
    }

    const route = parsed.route ?? null;
    const valid = Boolean(route && catalog.intentIds.includes(route));
    if (route && !valid) validation = "unknown_intent";

    const result: RouterResult = {
      provider: "llm",
      route: valid ? route : null,
      valid,
      latencyMs,
      estimatedCostUsd: estimateCostUsd("llm", usage.inputTokens, usage.outputTokens, model.id),
      confidence: null,
      probabilities: null,
      model: completion.model ?? model.id,
      usage,
      error: valid ? null : `Structured output did not match the ${catalog.intentCount}-intent contract.`,
      reason: parsed.reason ?? null,
    };

    return {
      result,
      trace: {
        systemInstruction: instruction,
        permittedRouteCount: catalog.intentCount,
        rawResponse: parsed,
        validation,
        selectedRoute: result.route,
        usage,
        timingMs: latencyMs,
      },
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    return {
      result: failed(model.id, sanitizeError(error), latencyMs),
      trace: { ...emptyTrace, validation: "provider_error", timingMs: latencyMs },
    };
  }
}

function failed(model: string, error: string, latencyMs: number): RouterResult {
  return {
    provider: "llm",
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
