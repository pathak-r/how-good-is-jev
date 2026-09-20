import { NextResponse } from "next/server";
import { publicConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = publicConfig();
  return NextResponse.json({
    ok: true,
    keysConfigured: config.keysConfigured,
    llmModel: config.llmModel,
    jevModel: config.jevModel,
    datasetVersion: config.datasetVersion,
  });
}
