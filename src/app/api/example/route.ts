import { NextResponse } from "next/server";
import { pickExample } from "@/lib/catalog";
import { DEFAULT_DATASET_ID, isDatasetId } from "@/lib/options";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const seedValue = params.get("seed");
  const seed = seedValue ? Number(seedValue) : undefined;
  const datasetParam = params.get("datasetId");
  const datasetId = isDatasetId(datasetParam) ? datasetParam : DEFAULT_DATASET_ID;
  const record = pickExample(datasetId, Number.isFinite(seed) ? seed : undefined);
  return NextResponse.json({
    id: record.id,
    utterance: record.utterance,
    datasetId,
  });
}
