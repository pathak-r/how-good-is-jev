export const DATASET_IDS = ["clinc150", "banking77", "hwu64"] as const;
export type DatasetId = (typeof DATASET_IDS)[number];

export const LLM_MODEL_IDS = ["gpt-4.1", "gpt-4.1-mini", "gpt-5.6-sol"] as const;
export type LlmModelId = (typeof LLM_MODEL_IDS)[number];

export const DATASET_OPTIONS = [
  {
    id: "clinc150",
    label: "CLINC150",
    intentCount: 150,
    version: "clinc150-full-v1",
  },
  {
    id: "banking77",
    label: "BANKING77",
    intentCount: 77,
    version: "banking77-v1",
  },
  {
    id: "hwu64",
    label: "HWU64",
    intentCount: 64,
    version: "hwu64-v1",
  },
] as const;

export const LLM_MODEL_OPTIONS = [
  {
    id: "gpt-4.1",
    label: "GPT-4.1",
    temperature: 0,
    reasoningEffort: null,
    inputPerMtok: 2,
    outputPerMtok: 8,
  },
  {
    id: "gpt-4.1-mini",
    label: "GPT-4.1 mini",
    temperature: 0,
    reasoningEffort: null,
    inputPerMtok: 0.4,
    outputPerMtok: 1.6,
  },
  {
    id: "gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    temperature: null,
    reasoningEffort: "none" as const,
    inputPerMtok: 4,
    outputPerMtok: 20,
  },
] as const;

export const DEFAULT_DATASET_ID: DatasetId = "clinc150";
export const DEFAULT_LLM_MODEL_ID: LlmModelId = "gpt-4.1";

export function isDatasetId(value: unknown): value is DatasetId {
  return DATASET_IDS.includes(value as DatasetId);
}

export function isLlmModelId(value: unknown): value is LlmModelId {
  return LLM_MODEL_IDS.includes(value as LlmModelId);
}

export function datasetOption(id: DatasetId = DEFAULT_DATASET_ID) {
  return DATASET_OPTIONS.find((item) => item.id === id) ?? DATASET_OPTIONS[0];
}

export function llmModelOption(id: LlmModelId = DEFAULT_LLM_MODEL_ID) {
  return LLM_MODEL_OPTIONS.find((item) => item.id === id) ?? LLM_MODEL_OPTIONS[0];
}
