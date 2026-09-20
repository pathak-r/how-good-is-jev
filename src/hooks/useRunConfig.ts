"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_DATASET_ID,
  DEFAULT_LLM_MODEL_ID,
  isDatasetId,
  isLlmModelId,
  type DatasetId,
  type LlmModelId,
} from "@/lib/options";

const STORAGE_KEY = "router-lab-run-config";

export function useRunConfig() {
  const [datasetId, setDatasetId] = useState<DatasetId>(DEFAULT_DATASET_ID);
  const [llmModel, setLlmModel] = useState<LlmModelId>(DEFAULT_LLM_MODEL_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { datasetId?: string; llmModel?: string };
        if (isDatasetId(parsed.datasetId)) setDatasetId(parsed.datasetId);
        if (isLlmModelId(parsed.llmModel)) setLlmModel(parsed.llmModel);
      }
    } catch {
      /* ignore */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ datasetId, llmModel }));
  }, [ready, datasetId, llmModel]);

  return { datasetId, setDatasetId, llmModel, setLlmModel };
}
