import {
  assertDatasetIntegrity,
  datasetVersion,
  getCatalog,
  getRecord,
  pickExample,
  recordsForSplit,
  sampleTestRecords,
} from "./catalog";
import { DEFAULT_DATASET_ID } from "./options";

export {
  assertDatasetIntegrity,
  datasetVersion,
  getCatalog,
  getRecord,
  pickExample,
  recordsForSplit,
  sampleTestRecords,
};

export function allRecords() {
  return getCatalog(DEFAULT_DATASET_ID).records;
}
