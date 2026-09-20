import type { DatasetId, LlmModelId } from "./options";

export type Split = "train" | "validation" | "test";
export type Provider = "jev" | "llm";

export type ClincRecord = {
  id: string;
  split: Split;
  utterance: string;
  intent: string;
  domain: string;
  isOos: boolean;
  source: string;
};

export type DatasetFile = {
  version: string;
  source: string;
  license: string;
  generatedAt: string;
  records: ClincRecord[];
};

export type UsageTokens = {
  inputTokens: number;
  outputTokens: number;
};

export type RouterResult = {
  provider: Provider;
  route: string | null;
  valid: boolean;
  latencyMs: number;
  estimatedCostUsd: number;
  confidence: number | null;
  probabilities: Record<string, number> | null;
  model: string;
  usage: UsageTokens;
  error: string | null;
  reason: string | null;
};

export type SafeLlmTrace = {
  systemInstruction: string;
  permittedRouteCount: number;
  rawResponse: unknown;
  validation: string;
  selectedRoute: string | null;
  usage: UsageTokens;
  timingMs: number;
};

export type SafeJevTrace = {
  question: string;
  choiceCount: number;
  selectedRoute: string | null;
  confidence: number | null;
  topProbabilities: Array<{ intent: string; probability: number }>;
  usage: UsageTokens;
  timingMs: number;
};

export type CompareResponse = {
  utterance: string;
  exampleId: string | null;
  groundTruth: { intent: string; domain: string; label: string } | null;
  openComparison: boolean;
  llm: RouterResult;
  jev: RouterResult;
  traces: {
    llm: SafeLlmTrace;
    jev: SafeJevTrace;
  };
  datasetVersion: string;
  datasetId: DatasetId;
  llmModel: LlmModelId;
  llmModelLabel: string;
  intentCount: number;
};

export type BenchmarkRow = {
  id: string;
  utterance: string;
  intent: string;
  domain: string;
  llm: RouterResult;
  jev: RouterResult;
};

export type BenchmarkMetrics = {
  sampleSize: number;
  seed: number;
  datasetVersion: string;
  datasetId?: DatasetId;
  llmModel?: LlmModelId;
  llmModelLabel?: string;
  llm: ProviderMetrics;
  jev: ProviderMetrics;
  disagreementRate: number;
  disagreements: BenchmarkRow[];
  accuracyByDomain: Array<{
    domain: string;
    count: number;
    llmAccuracy: number;
    jevAccuracy: number;
  }>;
};

export type ProviderMetrics = {
  routingAccuracy: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  estimatedCostUsd: number;
  outputValidity: number;
  failureRate: number;
  scored: number;
  failed: number;
};
