import { NextResponse } from "next/server";
import { runComparison } from "@/lib/compare";
import { publicConfig, runtimeConfig } from "@/lib/config";
import { allowCompare, clientKey, currentSpendUsd } from "@/lib/guards";
import { isDatasetId, isLlmModelId } from "@/lib/options";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const config = runtimeConfig();
  if (!allowCompare(clientKey(request.headers))) {
    return NextResponse.json({ error: "Rate limit reached. Try again in a minute." }, { status: 429 });
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

  let body: { utterance?: string; exampleId?: string; datasetId?: string; llmModel?: string } = {};
  try {
    body = (await request.json()) as {
      utterance?: string;
      exampleId?: string;
      datasetId?: string;
      llmModel?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const utterance = body.utterance?.trim() ?? "";
  if (!body.exampleId && !utterance) {
    return NextResponse.json({ error: "Enter a short request." }, { status: 400 });
  }
  if (utterance.length > config.maxInputChars) {
    return NextResponse.json(
      { error: `Keep the request under ${config.maxInputChars} characters.` },
      { status: 400 },
    );
  }

  if (body.datasetId && !isDatasetId(body.datasetId)) {
    return NextResponse.json({ error: "Unknown dataset." }, { status: 400 });
  }
  if (body.llmModel && !isLlmModelId(body.llmModel)) {
    return NextResponse.json({ error: "Unknown model." }, { status: 400 });
  }

  try {
    const result = await runComparison({
      utterance: body.exampleId ? undefined : utterance,
      exampleId: body.exampleId,
      datasetId: isDatasetId(body.datasetId) ? body.datasetId : undefined,
      llmModel: isLlmModelId(body.llmModel) ? body.llmModel : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comparison failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
