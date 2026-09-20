import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CANONICAL_INTENTS,
  DATASET_VERSION,
  domainForIntent,
  INTENT_CATALOG,
} from "../src/lib/intents";

type RawSplit = Record<string, Array<[string, string]>>;

const EXPECTED = {
  train: 15_000,
  val: 3_000,
  test: 4_500,
  oos_train: 100,
  oos_val: 100,
  oos_test: 1_000,
} as const;

const SPLIT_MAP = {
  train: "train",
  val: "validation",
  test: "test",
  oos_train: "train",
  oos_val: "validation",
  oos_test: "test",
} as const;

async function main() {
  const rawPath = path.resolve("data/raw/data_full.json");
  const raw = JSON.parse(await readFile(rawPath, "utf8")) as RawSplit;

  for (const [key, count] of Object.entries(EXPECTED)) {
    if (!raw[key] || raw[key].length !== count) {
      throw new Error(`Split ${key} expected ${count}, got ${raw[key]?.length ?? 0}`);
    }
  }

  const records = [];
  const counters: Record<string, number> = {};

  for (const [rawSplit, rows] of Object.entries(raw)) {
    const split = SPLIT_MAP[rawSplit as keyof typeof SPLIT_MAP];
    const isOos = rawSplit.startsWith("oos_");
    for (const [utterance, intent] of rows) {
      counters[split] = (counters[split] ?? 0) + 1;
      const id = `clinc-${split}-${String(counters[split]).padStart(5, "0")}`;
      records.push({
        id,
        split,
        utterance,
        intent,
        domain: domainForIntent(intent),
        isOos,
        source: "CLINC150",
      });
    }
  }

  const inScopeIntents = new Set(records.filter((r) => !r.isOos).map((r) => r.intent));
  if (inScopeIntents.size !== 150) {
    throw new Error(`Expected 150 in-scope intents, found ${inScopeIntents.size}`);
  }

  const missing = CANONICAL_INTENTS.filter((id) => !inScopeIntents.has(id));
  const extra = [...inScopeIntents].filter((id) => !CANONICAL_INTENTS.includes(id));
  if (missing.length || extra.length) {
    throw new Error(
      `Intent map mismatch. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}`,
    );
  }

  const unknownDomain = records.filter((r) => r.domain === "unknown");
  if (unknownDomain.length) {
    throw new Error(`Records with unknown domain: ${unknownDomain.length}`);
  }

  await mkdir("src/data", { recursive: true });
  await writeFile(
    "src/data/clinc150.json",
    JSON.stringify({
      version: DATASET_VERSION,
      source: "https://github.com/clinc/oos-eval",
      license: "CC BY 3.0",
      generatedAt: new Date().toISOString(),
      records,
    }),
    "utf8",
  );
  await writeFile("src/data/intents.json", JSON.stringify(INTENT_CATALOG, null, 2), "utf8");

  console.log(`Wrote ${records.length} records.`);
  console.log(`In-scope intents: ${inScopeIntents.size}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
