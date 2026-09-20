type Bucket = { count: number; resetAt: number };

const compareHits = new Map<string, Bucket>();
const benchmarkHits = new Map<string, Bucket>();

let spentUsd = 0;
let spendDay = utcDay(new Date());

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function take(map: Map<string, Bucket>, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = map.get(key);
  if (!current || now >= current.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}

export function allowCompare(key: string): boolean {
  return take(compareHits, key, 10, 60_000);
}

export function allowBenchmark(key: string): boolean {
  return take(benchmarkHits, key, 2, 10 * 60_000);
}

export function reserveSpend(amountUsd: number, ceilingUsd: number): boolean {
  const today = utcDay(new Date());
  if (today !== spendDay) {
    spendDay = today;
    spentUsd = 0;
  }
  if (spentUsd + amountUsd > ceilingUsd) return false;
  spentUsd += amountUsd;
  return true;
}

export function currentSpendUsd(): number {
  const today = utcDay(new Date());
  if (today !== spendDay) return 0;
  return spentUsd;
}

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.replaceAll(/sk-[a-zA-Z0-9]+/g, "[redacted]");
    if (/api[_-]?key|authorization|bearer/i.test(message)) {
      return "Provider request failed.";
    }
    return message.slice(0, 240);
  }
  return "Unknown provider error.";
}
