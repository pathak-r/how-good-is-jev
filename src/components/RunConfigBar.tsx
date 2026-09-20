"use client";

import { useState } from "react";
import { SentenceMenu } from "./SentenceMenu";
import { DATASET_OPTIONS, LLM_MODEL_OPTIONS, type DatasetId, type LlmModelId } from "@/lib/options";

export function RunConfigBar({
  llmModel,
  datasetId,
  onLlmModel,
  onDatasetId,
}: {
  llmModel: LlmModelId;
  datasetId: DatasetId;
  onLlmModel: (id: LlmModelId) => void;
  onDatasetId: (id: DatasetId) => void;
}) {
  const [openMenu, setOpenMenu] = useState<"llm" | "dataset" | null>(null);

  return (
    <h1 className="mt-3 font-display text-3xl font-medium leading-tight sm:text-4xl">
      Compare Jev with{" "}
      <SentenceMenu
        label="LLM to compare with"
        value={llmModel}
        options={LLM_MODEL_OPTIONS}
        onChange={onLlmModel}
        open={openMenu === "llm"}
        onOpenChange={(open) => setOpenMenu(open ? "llm" : null)}
      />{" "}
      on{" "}
      <SentenceMenu
        label="Dataset"
        value={datasetId}
        options={DATASET_OPTIONS}
        onChange={onDatasetId}
        open={openMenu === "dataset"}
        onOpenChange={(open) => setOpenMenu(open ? "dataset" : null)}
      />{`.`}
    </h1>
  );
}
