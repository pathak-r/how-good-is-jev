import { intentLabel } from "./intents";

export const HUMAN_CONFIDENCE_THRESHOLD = 0.5;

export function formatUsd(value: number): string {
  if (value === 0) return "$0";
  if (value < 0.0001) return `$${value.toExponential(2)}`;
  if (value < 0.01) return `$${value.toFixed(5)}`;
  return `$${value.toFixed(4)}`;
}

export function formatMs(value: number): string {
  return `${Math.round(value)} ms`;
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatRoute(route: string | null): string {
  if (!route) return "—";
  return intentLabel(route);
}

export function relativeSavingPct(baseline: number, other: number): number | null {
  if (baseline <= 0) return null;
  return ((baseline - other) / baseline) * 100;
}

export function formatRelativeSaving(
  baseline: number,
  other: number,
  noun: "cost" | "latency",
): string {
  const pct = relativeSavingPct(baseline, other);
  if (pct == null) return "Not enough data";
  if (Math.abs(pct) < 0.5) return `About the same ${noun}`;
  const rounded = Math.round(Math.abs(pct));
  if (noun === "cost") {
    return pct > 0 ? `Jev is ${rounded}% lower cost` : `Jev is ${rounded}% higher cost`;
  }
  return pct > 0 ? `Jev is ${rounded}% faster` : `Jev is ${rounded}% slower`;
}
