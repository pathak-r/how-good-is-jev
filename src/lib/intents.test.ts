import { describe, expect, it } from "vitest";
import { CANONICAL_INTENTS, DOMAINS, DOMAIN_INTENTS, INTENT_CATALOG, INTENT_DESCRIPTIONS } from "./intents";
import { exactMatch } from "./scoring";
import { summarizeBenchmark } from "./scoring";
import type { BenchmarkRow, RouterResult } from "./types";

describe("intent catalog", () => {
  it("has exactly 150 unique canonical intents", () => {
    expect(CANONICAL_INTENTS).toHaveLength(150);
    expect(new Set(CANONICAL_INTENTS).size).toBe(150);
  });

  it("has 10 domains of 15 intents", () => {
    expect(DOMAINS).toHaveLength(10);
    for (const domain of DOMAINS) {
      expect(DOMAIN_INTENTS[domain]).toHaveLength(15);
    }
  });

  it("has a description for every intent", () => {
    for (const intent of INTENT_CATALOG) {
      expect(INTENT_DESCRIPTIONS[intent.id]).toBeTruthy();
    }
  });
});

describe("exact-match scoring", () => {
  it("requires the canonical intent, not the domain", () => {
    expect(exactMatch("balance", "balance")).toBe(true);
    expect(exactMatch("transfer", "balance")).toBe(false);
    expect(exactMatch(null, "balance")).toBe(false);
  });

  it("keeps failed calls visible in the denominator", () => {
    const failed = result({ valid: false, route: null, error: "timeout" });
    const ok = result({ valid: true, route: "balance", error: null });
    const summary = summarizeBenchmark(
      [
        row("balance", "banking", ok, failed),
        row("balance", "banking", ok, ok),
      ],
      1,
      "test",
    );
    expect(summary.jev.failed).toBe(1);
    expect(summary.jev.scored).toBe(1);
    expect(summary.llm.routingAccuracy).toBe(1);
  });
});

function result(partial: Partial<RouterResult>): RouterResult {
  return {
    provider: "llm",
    route: null,
    valid: false,
    latencyMs: 10,
    estimatedCostUsd: 0,
    confidence: null,
    probabilities: null,
    model: "test",
    usage: { inputTokens: 0, outputTokens: 0 },
    error: null,
    reason: null,
    ...partial,
  };
}

function row(intent: string, domain: string, llm: RouterResult, jev: RouterResult): BenchmarkRow {
  return {
    id: `${intent}-${domain}`,
    utterance: "x",
    intent,
    domain,
    llm,
    jev,
  };
}
