import { CANONICAL_INTENTS } from "@/lib/intents";

export default function MethodologyPage() {
  return (
    <article>
      <p className="text-xs uppercase text-mute">Methodology</p>
      <h1 className="mt-3 font-display text-4xl font-medium">What this lab measures</h1>
      <div className="mt-6 space-y-5 text-sm leading-7">
        <p>
          Primary task: exact intent routing on the dataset you pick. CLINC150 is 150-way and
          multi-domain. BANKING77 is 77-way banking. HWU64 is 64-way home assistant. Right domain,
          wrong intent still counts as wrong.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Datasets: CLINC150 ({CANONICAL_INTENTS.length} intents), BANKING77 (77), HWU64 (64).</li>
          <li>Headline split: held-out test only. Training data is not scored.</li>
          <li>Allowed destinations: the selected dataset’s canonical intent identifiers, identical for both systems.</li>
          <li>
            LLM: GPT-4.1 or GPT-4.1 mini with structured outputs and temperature 0. GPT-5.6 Sol with
            structured outputs and reasoning effort none (temperature is not sent).
          </li>
          <li>Jev: TypeSafe System One Choice over the same label set.</li>
          <li>Latency: server-side duration of each provider call, not total page time.</li>
          <li>
            Cost: token usage × that model’s USD / 1M token prices. We report Jev as “x% lower” or
            “x% higher” vs the chosen LLM on the observed run. Pricing as of 20 Sep 2026. GPT-4.1
            $2 / $8, GPT-4.1 mini $0.40 / $1.60, GPT-5.6 Sol $4 / $20, Jev $0.042 / $0.
          </li>
          <li>Jev confidence: below 50% routes to a human; 50% or higher auto-routes to the chosen intent. That cutoff is a demo rule, not a Jev default.</li>
          <li>Failures: timeouts, schema errors, and provider errors stay in the denominator.</li>
          <li>Runs with different models or datasets are not comparable to each other.</li>
        </ul>
        <p>
          CLINC150 is licensed under Creative Commons Attribution 3.0. Source:{" "}
          <a className="underline" href="https://github.com/clinc/oos-eval">
            clinc/oos-eval
          </a>
          . Citation: Larson et al., EMNLP 2019. BANKING77 is CC BY 4.0 from{" "}
          <a className="underline" href="https://github.com/PolyAI-LDN/task-specific-datasets">
            PolyAI-LDN/task-specific-datasets
          </a>
          . HWU64 is CC BY-SA 3.0 from{" "}
          <a className="underline" href="https://github.com/xliuhw/NLU-Evaluation-Data">
            xliuhw/NLU-Evaluation-Data
          </a>
          , using the standard 64-intent held-out split.
        </p>
        <p>This is a router benchmark, not a claim that one architecture is universally better.</p>
      </div>
    </article>
  );
}
