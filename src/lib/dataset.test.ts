import { describe, expect, it } from "vitest";
import { allRecords, recordsForSplit, sampleTestRecords } from "./dataset";
import { assertDatasetIntegrity, getCatalog, recordsForSplit as catalogSplit } from "./catalog";
import { CANONICAL_INTENTS } from "./intents";

describe("normalized CLINC150 dataset", () => {
  it("has expected split counts", () => {
    const records = allRecords();
    expect(records).toHaveLength(23_700);
    expect(recordsForSplit("clinc150", "train")).toHaveLength(15_000);
    expect(recordsForSplit("clinc150", "validation")).toHaveLength(3_000);
    expect(recordsForSplit("clinc150", "test")).toHaveLength(4_500);
    expect(allRecords().filter((record) => record.isOos)).toHaveLength(1_200);
  });

  it("covers all 150 canonical intents on the test split", () => {
    const intents = new Set(recordsForSplit("clinc150", "test").map((record) => record.intent));
    expect(intents.size).toBe(150);
    for (const intent of CANONICAL_INTENTS) {
      expect(intents.has(intent)).toBe(true);
    }
  });

  it("samples deterministically from the test split", () => {
    const a = sampleTestRecords("clinc150", 25, 150).map((record) => record.id);
    const b = sampleTestRecords("clinc150", 25, 150).map((record) => record.id);
    const c = sampleTestRecords("clinc150", 25, 151).map((record) => record.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe("BANKING77 and HWU64 catalogs", () => {
  it("loads BANKING77 with 77 intents and a held-out test split", () => {
    const catalog = getCatalog("banking77");
    expect(catalog.intentCount).toBe(77);
    expect(catalog.intentIds).toHaveLength(77);
    expect(catalogSplit("banking77", "test").length).toBe(3_080);
    expect(() => assertDatasetIntegrity("banking77")).not.toThrow();
  });

  it("loads HWU64 with 64 intents and a held-out test split", () => {
    const catalog = getCatalog("hwu64");
    expect(catalog.intentCount).toBe(64);
    expect(catalog.intentIds).toHaveLength(64);
    expect(catalogSplit("hwu64", "test").length).toBe(1_076);
    expect(() => assertDatasetIntegrity("hwu64")).not.toThrow();
  });
});
