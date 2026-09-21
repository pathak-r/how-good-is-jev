import { describe, expect, it } from "vitest";
import {
  formatDirectionalDelta,
  formatRelativeSaving,
  formatUsdPerThousand,
  relativeSavingPct,
} from "./format";

describe("relative saving", () => {
  it("reports Jev cost as percent lower than the LLM", () => {
    expect(relativeSavingPct(0.000446, 0.00013)).toBeCloseTo(70.85, 1);
    expect(formatRelativeSaving(0.000446, 0.00013, "cost")).toBe("Jev is 71% lower cost");
  });

  it("reports when Jev is more expensive or slower", () => {
    expect(formatRelativeSaving(1, 2, "cost")).toBe("Jev is 100% higher cost");
    expect(formatRelativeSaving(1000, 1500, "latency")).toBe("Jev is 50% slower");
  });
});

describe("directional delta", () => {
  it("names the direction when Jev is lower than the LLM", () => {
    expect(formatDirectionalDelta(0.00448, 0.00013, "cost")).toBe("97% cheaper");
    expect(formatDirectionalDelta(1893, 1266, "latency")).toBe("33% faster");
  });

  it("names the direction when Jev is higher than the LLM", () => {
    expect(formatDirectionalDelta(1, 2, "cost")).toBe("100% more expensive");
    expect(formatDirectionalDelta(1278, 1442, "latency")).toBe("13% slower");
  });

  it("collapses negligible and undefined differences", () => {
    expect(formatDirectionalDelta(1000, 1000, "latency")).toBe("Same speed");
    expect(formatDirectionalDelta(0, 0.5, "cost")).toBe("—");
  });
});

describe("cost per thousand routes", () => {
  it("scales small per-call costs into a readable figure", () => {
    expect(formatUsdPerThousand(0.00448)).toBe("$4.48");
    expect(formatUsdPerThousand(0.00013)).toBe("$0.130");
    expect(formatUsdPerThousand(0)).toBe("$0");
  });
});
