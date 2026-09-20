import { routeWithJev } from "./adapters/jev";
import { routeWithLlm } from "./adapters/llm";
import { getCatalog, sampleTestRecords } from "./catalog";
import { runtimeConfig } from "./config";
import { reserveSpend } from "./guards";
import { DEFAULT_DATASET_ID, DEFAULT_LLM_MODEL_ID, type DatasetId, type LlmModelId, llmModelOption } from "./options";
import { summarizeBenchmark } from "./scoring";
import type { BenchmarkMetrics, BenchmarkRow } from "./types";

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export async function runBenchmark(
  size: number,
  seed: number,
  datasetId: DatasetId = DEFAULT_DATASET_ID,
  llmModelId: LlmModelId = DEFAULT_LLM_MODEL_ID,
): Promise<BenchmarkMetrics> {
  const config = runtimeConfig();
  const catalog = getCatalog(datasetId);
  const capped = Math.min(Math.max(1, size), config.maxBenchmarkSize);
  const records = sampleTestRecords(datasetId, capped, seed);

  const rows = await mapPool(records, config.benchmarkConcurrency, async (record) => {
    const [llm, jev] = await Promise.all([
      routeWithLlm(record.utterance, catalog, llmModelId),
      routeWithJev(record.utterance, catalog),
    ]);
    const row: BenchmarkRow = {
      id: record.id,
      utterance: record.utterance,
      intent: record.intent,
      domain: record.domain,
      llm: llm.result,
      jev: jev.result,
    };
    reserveSpend(
      llm.result.estimatedCostUsd + jev.result.estimatedCostUsd,
      config.dailyCostCeilingUsd,
    );
    return row;
  });

  return {
    ...summarizeBenchmark(rows, seed, catalog.version),
    datasetId,
    llmModel: llmModelId,
    llmModelLabel: llmModelOption(llmModelId).label,
  };
}
