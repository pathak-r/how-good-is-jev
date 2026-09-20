import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function humanize(id: string): string {
  return id.replaceAll("_", " ");
}

function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    if (inQuotes) {
      if (char === '"') {
        if (raw[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char === "\r") continue;
    field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseBankingCsv(raw: string): Array<{ utterance: string; intent: string }> {
  const rows = parseCsv(raw.replace(/^\uFEFF/, ""));
  const header = rows.shift();
  if (!header || header[0] !== "text" || header[1] !== "category") {
    throw new Error(`Unexpected BANKING77 header: ${header?.join(",")}`);
  }
  return rows.map((row) => {
    if (row.length < 2 || !row[0] || !row[1]) {
      throw new Error(`Bad BANKING77 row: ${row.join(" | ").slice(0, 80)}`);
    }
    return { utterance: row[0], intent: row[1] };
  });
}

async function writeJson(rel: string, value: unknown) {
  await mkdir(path.dirname(rel), { recursive: true });
  await writeFile(rel, JSON.stringify(value), "utf8");
}

async function banking77() {
  const categories = JSON.parse(
    await readFile("data/raw/banking77/categories.json", "utf8"),
  ) as string[];
  if (categories.length !== 77) {
    throw new Error(`Expected 77 BANKING77 intents, got ${categories.length}`);
  }
  const train = parseBankingCsv(await readFile("data/raw/banking77/train.csv", "utf8"));
  const test = parseBankingCsv(await readFile("data/raw/banking77/test.csv", "utf8"));
  if (train.length !== 10_003 || test.length !== 3_080) {
    throw new Error(`BANKING77 counts off: train ${train.length}, test ${test.length}`);
  }

  const records = [
    ...train.map((row, index) => ({
      id: `banking77-train-${String(index + 1).padStart(5, "0")}`,
      split: "train" as const,
      utterance: row.utterance,
      intent: row.intent,
      domain: "banking",
      isOos: false,
      source: "banking77" as const,
    })),
    ...test.map((row, index) => ({
      id: `banking77-test-${String(index + 1).padStart(5, "0")}`,
      split: "test" as const,
      utterance: row.utterance,
      intent: row.intent,
      domain: "banking",
      isOos: false,
      source: "banking77" as const,
    })),
  ];

  const seen = new Set(records.map((row) => row.intent));
  if (seen.size !== 77) throw new Error(`BANKING77 unique intents: ${seen.size}`);

  await writeJson("src/data/banking77.json", {
    id: "banking77",
    label: "BANKING77",
    version: "banking77-v1",
    source: "https://github.com/PolyAI-LDN/task-specific-datasets",
    license: "CC BY 4.0",
    generatedAt: new Date().toISOString(),
    intents: categories.map((id) => ({
      id,
      label: humanize(id),
      domain: "banking",
      description: `Banking request about ${humanize(id)}.`,
    })),
    records,
  });
  console.log(`BANKING77: ${records.length} records, ${categories.length} intents.`);
}

function hwuDomain(intent: string): string {
  const parts = intent.split("_");
  if (intent.startsWith("iot_")) return "iot";
  if (intent.startsWith("qa_")) return "qa";
  return parts[0] ?? "unknown";
}

async function readHwuSplit(split: "train" | "valid" | "test") {
  const texts = (await readFile(`data/raw/hwu64/${split}/seq.in`, "utf8"))
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  const labels = (await readFile(`data/raw/hwu64/${split}/label`, "utf8"))
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  if (texts.length !== labels.length) {
    throw new Error(`HWU64 ${split} length mismatch ${texts.length} vs ${labels.length}`);
  }
  const mapped = split === "valid" ? "validation" : split;
  return texts.map((utterance, index) => ({
    id: `hwu64-${mapped}-${String(index + 1).padStart(5, "0")}`,
    split: mapped as "train" | "validation" | "test",
    utterance,
    intent: labels[index],
    domain: hwuDomain(labels[index]),
    isOos: false,
    source: "hwu64" as const,
  }));
}

async function hwu64() {
  const train = await readHwuSplit("train");
  const validation = await readHwuSplit("valid");
  const test = await readHwuSplit("test");
  if (train.length !== 8_954 || validation.length !== 1_076 || test.length !== 1_076) {
    throw new Error(
      `HWU64 counts off: train ${train.length}, val ${validation.length}, test ${test.length}`,
    );
  }
  const records = [...train, ...validation, ...test];
  const intents = [...new Set(records.map((row) => row.intent))].sort();
  if (intents.length !== 64) throw new Error(`HWU64 unique intents: ${intents.length}`);

  await writeJson("src/data/hwu64.json", {
    id: "hwu64",
    label: "HWU64",
    version: "hwu64-v1",
    source: "https://github.com/xliuhw/NLU-Evaluation-Data",
    license: "CC BY-SA 3.0",
    generatedAt: new Date().toISOString(),
    intents: intents.map((id) => ({
      id,
      label: humanize(id),
      domain: hwuDomain(id),
      description: `Home-assistant request about ${humanize(id)}.`,
    })),
    records,
  });
  console.log(`HWU64: ${records.length} records, ${intents.length} intents.`);
}

async function main() {
  await banking77();
  await hwu64();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
