export default function HowItWorksPage() {
  return (
    <article>
      <p className="text-xs uppercase text-mute">How it works</p>
      <h1 className="mt-3 font-display text-4xl font-medium">Generative routing vs typed decisions</h1>
      <div className="mt-6 space-y-5 text-sm leading-7 text-ink/90">
        <p>
          Both lanes solve the same problem: read a short request and choose one labeled intent
          from the dataset you pick — CLINC150, BANKING77, or HWU64. They do not call banks,
          calendars, or other tools. A route is just a named destination.
        </p>
        <section className="rounded-2xl border border-rule bg-card p-5">
          <h2 className="font-display text-2xl font-medium">Traditional LLM</h2>
          <p className="mt-2">
            Input → prompt and JSON schema → generative inference → structured response →
            validation → route.
          </p>
          <p className="mt-2 text-mute">
            The model writes text, then we parse it and check it against the allowed intent list.
            Structured outputs make that contract stricter, but the model is still generating.
          </p>
        </section>
        <section className="rounded-2xl border border-rule bg-card p-5">
          <h2 className="font-display text-2xl font-medium">Jev</h2>
          <p className="mt-2">
            Input → typed decision definition → decision inference → probability / confidence →
            route.
          </p>
          <p className="mt-2 text-mute">
            Jev gets a Choice question over the same intent list. It returns a label plus
            calibrated confidence, not a generated paragraph. Below 50% confidence, this lab
            treats that as “routes to a human.” At or above 50%, it auto-routes to the chosen
            intent.
          </p>
        </section>
        <p>
          Compare mode is for one example. Benchmark mode is for a held-out sample. Accuracy,
          latency, cost, and validity stay separate. The lab does not pick a winner.
        </p>
      </div>
    </article>
  );
}
