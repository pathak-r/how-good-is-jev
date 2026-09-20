import clincFile from "@/data/clinc150.json";
import bankingFile from "@/data/banking77.json";
import hwuFile from "@/data/hwu64.json";
import { INTENT_CATALOG } from "./intents";
import {
  DEFAULT_DATASET_ID,
  type DatasetId,
  datasetOption,
} from "./options";
import type { Split } from "./types";

export type IntentMeta = {
  id: string;
  label: string;
  domain: string;
  description: string;
};

export type UtteranceRecord = {
  id: string;
  split: Split;
  utterance: string;
  intent: string;
  domain: string;
  isOos: boolean;
  source: string;
};

export type DatasetCatalog = {
  id: DatasetId;
  label: string;
  version: string;
  source: string;
  license: string;
  intentCount: number;
  intents: IntentMeta[];
  intentIds: string[];
  records: UtteranceRecord[];
  question: string;
};

type PackedDataset = {
  id: DatasetId;
  label: string;
  version: string;
  source: string;
  license: string;
  intents: IntentMeta[];
  records: UtteranceRecord[];
};

const QUESTIONS: Record<DatasetId, string> = {
  clinc150: "Select the exact CLINC150 intent that best matches this user request.",
  banking77: "Select the exact BANKING77 intent that best matches this user request.",
  hwu64: "Select the exact HWU64 intent that best matches this user request.",
};

function pack(file: PackedDataset): DatasetCatalog {
  return {
    ...file,
    intentCount: file.intents.length,
    intentIds: file.intents.map((intent) => intent.id),
    question: QUESTIONS[file.id],
  };
}

const CLINC_RECORDS = (clincFile as { version: string; source: string; license: string; records: UtteranceRecord[] })
  .records;

const catalogs: Record<DatasetId, DatasetCatalog> = {
  clinc150: pack({
    id: "clinc150",
    label: "CLINC150",
    version: (clincFile as { version: string }).version,
    source: (clincFile as { source: string }).source,
    license: (clincFile as { license: string }).license,
    intents: INTENT_CATALOG.map((intent) => ({
      id: intent.id,
      label: intent.label,
      domain: intent.domain,
      description: intent.description,
    })),
    records: CLINC_RECORDS.map((record) => ({
      ...record,
      source: "clinc150",
    })),
  }),
  banking77: pack(bankingFile as PackedDataset),
  hwu64: pack(hwuFile as PackedDataset),
};

export function getCatalog(id: DatasetId = DEFAULT_DATASET_ID): DatasetCatalog {
  return catalogs[id] ?? catalogs[DEFAULT_DATASET_ID];
}

export function recordsForSplit(
  datasetId: DatasetId,
  split: Split,
  includeOos = false,
): UtteranceRecord[] {
  return getCatalog(datasetId).records.filter(
    (record) => record.split === split && (includeOos || !record.isOos),
  );
}

export function getRecord(datasetId: DatasetId, id: string): UtteranceRecord | undefined {
  return getCatalog(datasetId).records.find((record) => record.id === id);
}

export function datasetVersion(datasetId: DatasetId = DEFAULT_DATASET_ID): string {
  return getCatalog(datasetId).version || datasetOption(datasetId).version;
}

export function intentMeta(catalog: DatasetCatalog, intent: string): IntentMeta | undefined {
  return catalog.intents.find((item) => item.id === intent);
}

export function intentLabel(catalog: DatasetCatalog, intent: string): string {
  if (intent === "oos") return "out of scope";
  return intentMeta(catalog, intent)?.label ?? intent.replaceAll("_", " ");
}

export function domainLabel(domain: string): string {
  if (domain === "oos") return "Out of scope";
  if (domain === "credit_cards") return "Credit cards";
  if (domain === "kitchen_dining") return "Kitchen & dining";
  if (domain === "auto_commute") return "Auto & commute";
  if (domain === "small_talk") return "Small talk";
  return domain.replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function choiceCriteria(catalog: DatasetCatalog): Record<string, string> {
  return Object.fromEntries(catalog.intents.map((intent) => [intent.id, intent.description]));
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleTestRecords(
  datasetId: DatasetId,
  size: number,
  seed: number,
  includeOos = false,
): UtteranceRecord[] {
  const pool = [...recordsForSplit(datasetId, "test", includeOos)];
  const rand = mulberry32(seed);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(size, pool.length));
}

export function pickExample(datasetId: DatasetId, seed?: number): UtteranceRecord {
  const pool = recordsForSplit(datasetId, "test");
  if (seed === undefined) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return sampleTestRecords(datasetId, 1, seed)[0];
}

export function assertDatasetIntegrity(datasetId: DatasetId = DEFAULT_DATASET_ID) {
  const catalog = getCatalog(datasetId);
  const inScope = catalog.records.filter((record) => !record.isOos);
  const intents = new Set(inScope.map((record) => record.intent));
  if (intents.size !== catalog.intentCount) {
    throw new Error(
      `${catalog.label} has ${intents.size} in-scope intents, expected ${catalog.intentCount}`,
    );
  }
  for (const intent of catalog.intentIds) {
    if (!intents.has(intent)) throw new Error(`${catalog.label} missing intent ${intent}`);
  }
}
