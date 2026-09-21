import Link from "next/link";
import { CANONICAL_INTENTS } from "@/lib/intents";

export default function MethodologyPage() {
  return (
    <article>
      <p className="label">Methodology</p>
      <h1 className="mt-3 max-w-headline font-display text-xl leading-tight sm:text-2xl">
        What this lab measures
      </h1>
      <p className="mt-5 max-w-measure text-base">
        Exact intent routing on the dataset you pick. Right domain, wrong intent still counts as
        wrong.
      </p>

      <div className="mt-10 max-w-measure space-y-8">
        <Group title="Task and data">
          <Item>
            Datasets: CLINC150 ({CANONICAL_INTENTS.length} intents, multi-domain), BANKING77 (77,
            banking), HWU64 (64, home assistant).
          </Item>
          <Item>Headline split: held-out test only. Training data is not scored.</Item>
          <Item>
            Allowed destinations: the selected dataset’s canonical intent identifiers, identical for
            both systems.
          </Item>
        </Group>

        <Group title="Systems">
          <Item>
            LLM: GPT-4.1 or GPT-4.1 mini with structured outputs and temperature 0. GPT-5.6 Sol or
            GPT-5.6 Terra with structured outputs and reasoning effort none (temperature is not
            sent).
          </Item>
          <Item>Jev: TypeSafe System One Choice over the same label set.</Item>
        </Group>

        <Group title="Measurement">
          <Item>Latency: server-side duration of each provider call, not total page time.</Item>
          <Item>
            Cost: token usage × that model’s USD / 1M token prices, reported as a percentage
            difference against the chosen LLM on the observed run.
          </Item>
          <Item>
            Jev confidence: below 50% routes to a human, 50% or higher auto-routes. A demo rule, not
            a Jev default.
          </Item>
          <Item>Failures: timeouts, schema errors, and provider errors stay in the denominator.</Item>
          <Item>Runs with different models or datasets are not comparable to each other.</Item>
        </Group>

        <Group title="Pricing, as of 20 Sep 2026">
          <table className="w-full border border-rule bg-card text-left">
            <thead>
              <tr className="border-b border-rule">
                <th className="label px-4 py-2.5 font-normal">Model</th>
                <th className="label px-4 py-2.5 text-right font-normal">Input</th>
                <th className="label px-4 py-2.5 text-right font-normal">Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {PRICES.map((row) => (
                <tr key={row.model}>
                  <td className="px-4 py-2.5 text-sm">{row.model}</td>
                  <td className="num px-4 py-2.5 text-right text-sm">{row.input}</td>
                  <td className="num px-4 py-2.5 text-right text-sm">{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-mute">USD per 1M tokens.</p>
        </Group>

        <Group title="Sources and licenses">
          <Item>
            CLINC150 — CC BY 3.0,{" "}
            <Source href="https://github.com/clinc/oos-eval">clinc/oos-eval</Source>. Citation:
            Larson et al., EMNLP 2019.
          </Item>
          <Item>
            BANKING77 — CC BY 4.0,{" "}
            <Source href="https://github.com/PolyAI-LDN/task-specific-datasets">
              PolyAI-LDN/task-specific-datasets
            </Source>
            .
          </Item>
          <Item>
            HWU64 — CC BY-SA 3.0,{" "}
            <Source href="https://github.com/xliuhw/NLU-Evaluation-Data">
              xliuhw/NLU-Evaluation-Data
            </Source>
            , standard 64-intent held-out split.
          </Item>
        </Group>

        <p className="text-base">
          This is a router benchmark, not a claim that one architecture is universally better.
        </p>
      </div>

      <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-5 text-sm">
        <Link href="/" className="underline underline-offset-4 hover:text-ink">
          Run a comparison
        </Link>
        <Link href="/how-it-works" className="underline underline-offset-4 hover:text-ink">
          How the two lanes differ
        </Link>
      </nav>
    </article>
  );
}

const PRICES = [
  { model: "GPT-4.1", input: "$2", output: "$8" },
  { model: "GPT-4.1 mini", input: "$0.40", output: "$1.60" },
  { model: "GPT-5.6 Sol", input: "$4", output: "$20" },
  { model: "GPT-5.6 Terra", input: "$2", output: "$12" },
  { model: "Jev", input: "$0.042", output: "$0" },
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="label border-b border-rule pb-2">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return <p className="text-base">{children}</p>;
}

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="underline underline-offset-4" href={href}>
      {children}
    </a>
  );
}
