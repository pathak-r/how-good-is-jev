import { NextResponse } from "next/server";
import { publicConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(publicConfig());
}
