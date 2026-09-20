import { describe, expect, it } from "vitest";
import { formatRelativeSaving, relativeSavingPct } from "./format";

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
