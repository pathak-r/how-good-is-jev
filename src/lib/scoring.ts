import { domainForIntent } from "./intents";
import type { BenchmarkMetrics, BenchmarkRow, ProviderMetrics, RouterResult } from "./types";

export function exactMatch(predicted: string | null, gold: string): boolean {
  return predicted === gold;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

function providerMetrics(rows: Array<{ gold: string; result: RouterResult }>): ProviderMetrics {
  const failed = rows.filter((row) => !row.result.valid || row.result.error);
  const scored = rows.filter((row) => row.result.valid && !row.result.error);
  const correct = scored.filter((row) => exactMatch(row.result.route, row.gold));
  return {
    routingAccuracy: scored.length ? correct.length / scored.length : 0,
    averageLatencyMs: mean(rows.map((row) => row.result.latencyMs)),
    p95LatencyMs: percentile(
      rows.map((row) => row.result.latencyMs),
      95,
    ),
    estimatedCostUsd: rows.reduce((sum, row) => sum + row.result.estimatedCostUsd, 0),
    outputValidity: rows.length ? scored.length / rows.length : 0,
    failureRate: rows.length ? failed.length / rows.length : 0,
    scored: scored.length,
    failed: failed.length,
  };
}

export function summarizeBenchmark(
  rows: BenchmarkRow[],
  seed: number,
  datasetVersion: string,
): BenchmarkMetrics {
  const llm = providerMetrics(rows.map((row) => ({ gold: row.intent, result: row.llm })));
  const jev = providerMetrics(rows.map((row) => ({ gold: row.intent, result: row.jev })));
  const disagreements = rows.filter((row) => {
    if (!row.llm.route || !row.jev.route) return row.llm.route !== row.jev.route;
    return row.llm.route !== row.jev.route;
  });

  const domains = [...new Set(rows.map((row) => row.domain))].sort();
  const accuracyByDomain = domains.map((domain) => {
    const subset = rows.filter((row) => row.domain === domain);
    const llmCorrect = subset.filter((row) => exactMatch(row.llm.route, row.intent)).length;
    const jevCorrect = subset.filter((row) => exactMatch(row.jev.route, row.intent)).length;
    return {
      domain,
      count: subset.length,
      llmAccuracy: subset.length ? llmCorrect / subset.length : 0,
      jevAccuracy: subset.length ? jevCorrect / subset.length : 0,
    };
  });

  return {
    sampleSize: rows.length,
    seed,
    datasetVersion,
    llm,
    jev,
    disagreementRate: rows.length ? disagreements.length / rows.length : 0,
    disagreements,
    accuracyByDomain,
  };
}

export function domainOf(intent: string): string {
  return domainForIntent(intent);
}
