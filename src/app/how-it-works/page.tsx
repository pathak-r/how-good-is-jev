import Link from "next/link";

const LLM_STEPS = ["Input", "Prompt + JSON schema", "Generative inference", "Validation", "Route"];
const JEV_STEPS = ["Input", "Typed decision definition", "Decision inference", "Confidence", "Route"];

export default function HowItWorksPage() {
  return (
    <article>
      <p className="label">How it works</p>
      <h1 className="mt-3 max-w-headline font-display text-xl leading-tight sm:text-2xl">
        Generative routing vs typed decisions
      </h1>
      <p className="mt-5 max-w-measure text-base">
        Both lanes answer the same question — read a short request, pick one labeled intent — but
        one of them writes an answer and the other one measures it.
      </p>

      <div className="mt-6 max-w-measure space-y-5 text-base text-ink/90">
        <p>
          The dataset you pick supplies the intent list: CLINC150, BANKING77, or HWU64. Neither lane
          calls banks, calendars, or other tools. A route is just a named destination.
        </p>
      </div>

      <div className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-2">
        <Lane
          title="Traditional LLM"
          steps={LLM_STEPS}
          note="The model writes text, then we parse it and check it against the allowed intent list. Structured outputs make that contract stricter, but the model is still generating."
        />
        <Lane
          title="Jev"
          steps={JEV_STEPS}
          note="Jev gets a Choice question over the same intent list and returns a label with a calibrated confidence, not a generated paragraph."
        />
      </div>

      <aside className="mt-4 max-w-headline border-l-2 border-ink bg-card px-5 py-4">
        <p className="label">Confidence rule in this lab</p>
        <p className="mt-2 text-base">
          Below 50% confidence, a Jev answer counts as “routes to a human.” At or above 50% it
          auto-routes to the chosen intent. That cutoff is a choice this demo made, not a Jev
          default.
        </p>
      </aside>

      <div className="mt-10 max-w-measure space-y-3 text-base">
        <p>Compare mode runs one example. Benchmark mode runs a held-out sample.</p>
        <p>
          Accuracy, latency, cost, and validity stay separate throughout. The lab does not pick a
          winner.
        </p>
      </div>

      <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-rule pt-5 text-sm">
        <Link href="/" className="underline underline-offset-4 hover:text-ink">
          Run a comparison
        </Link>
        <Link href="/methodology" className="underline underline-offset-4 hover:text-ink">
          Read the methodology
        </Link>
      </nav>
    </article>
  );
}

function Lane({ title, steps, note }: { title: string; steps: string[]; note: string }) {
  return (
    <section className="bg-card p-5">
      <h2 className="font-display text-lg leading-tight">{title}</h2>
      <ol className="mt-4 divide-y divide-rule border border-rule">
        {steps.map((step, index) => (
          <li key={step} className="flex items-baseline gap-3 px-3 py-2.5">
            <span className="num text-micro text-mute">{String(index + 1).padStart(2, "0")}</span>
            <span className="text-sm">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-mute">{note}</p>
    </section>
  );
}
