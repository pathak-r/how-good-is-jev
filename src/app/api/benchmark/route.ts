import { NextResponse } from "next/server";
import { runBenchmark } from "@/lib/benchmark";
import { publicConfig, runtimeConfig } from "@/lib/config";
import { allowBenchmark, clientKey, currentSpendUsd } from "@/lib/guards";
import { isDatasetId, isLlmModelId } from "@/lib/options";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const config = runtimeConfig();
  if (!allowBenchmark(clientKey(request.headers))) {
    return NextResponse.json(
      { error: "Benchmark rate limit reached. Try again in a few minutes." },
      { status: 429 },
    );
  }

  if (currentSpendUsd() >= config.dailyCostCeilingUsd) {
    return NextResponse.json({ error: "Demo limit reached for today." }, { status: 429 });
  }

  if (!publicConfig().keysConfigured) {
    return NextResponse.json(
      { error: "API keys are not configured on the server yet." },
      { status: 503 },
    );
  }

  let body: { size?: number; seed?: number; datasetId?: string; llmModel?: string } = {};
  try {
    body = (await request.json()) as {
      size?: number;
      seed?: number;
      datasetId?: string;
      llmModel?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const size = Math.min(config.maxBenchmarkSize, Math.max(1, Number(body.size) || 25));
  const seed = Number.isFinite(Number(body.seed)) ? Number(body.seed) : 150;
  if (![25, 50, 100].includes(size)) {
    return NextResponse.json({ error: "Sample size must be 25, 50, or 100." }, { status: 400 });
  }
  if (body.datasetId && !isDatasetId(body.datasetId)) {
    return NextResponse.json({ error: "Unknown dataset." }, { status: 400 });
  }
  if (body.llmModel && !isLlmModelId(body.llmModel)) {
    return NextResponse.json({ error: "Unknown model." }, { status: 400 });
  }

  try {
    const result = await runBenchmark(
      size,
      seed,
      isDatasetId(body.datasetId) ? body.datasetId : undefined,
      isLlmModelId(body.llmModel) ? body.llmModel : undefined,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Benchmark failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
