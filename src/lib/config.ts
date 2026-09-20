import { llmModelOption, type LlmModelId } from "./options";

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function publicConfig() {
  return {
    llmModel: process.env.LLM_MODEL ?? "gpt-4.1",
    jevModel: process.env.JEV_MODEL ?? "jev-latest",
    datasetVersion: "clinc150-full-v1",
    maxBenchmarkSize: num("MAX_BENCHMARK_SIZE", 100),
    maxInputChars: num("MAX_INPUT_CHARS", 500),
    sampleSizes: [25, 50, 100] as const,
    pricingAsOf: process.env.PRICING_AS_OF ?? "2026-09-20",
    prices: {
      openaiInputPerMtok: num("OPENAI_INPUT_PRICE_PER_MTOK", 2),
      openaiOutputPerMtok: num("OPENAI_OUTPUT_PRICE_PER_MTOK", 8),
      jevInputPerMtok: num("JEV_INPUT_PRICE_PER_MTOK", 0.042),
      jevOutputPerMtok: num("JEV_OUTPUT_PRICE_PER_MTOK", 0),
    },
    dailyCostCeilingUsd: num("DAILY_COST_CEILING_USD", 5),
    keysConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.TYPESAFE_API_KEY),
  };
}

export function runtimeConfig() {
  const pub = publicConfig();
  return {
    ...pub,
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    typesafeApiKey: process.env.TYPESAFE_API_KEY ?? "",
    compareTimeoutMs: num("COMPARE_TIMEOUT_MS", 45_000),
    benchmarkConcurrency: num("BENCHMARK_CONCURRENCY", 3),
  };
}

export function estimateCostUsd(
  provider: "jev" | "llm",
  inputTokens: number,
  outputTokens: number,
  llmModelId?: LlmModelId,
): number {
  const prices = publicConfig().prices;
  if (provider === "jev") {
    return (inputTokens * prices.jevInputPerMtok + outputTokens * prices.jevOutputPerMtok) / 1_000_000;
  }
  const model = llmModelOption(llmModelId);
  return (inputTokens * model.inputPerMtok + outputTokens * model.outputPerMtok) / 1_000_000;
}
