# How good is Jev?

Public comparison lab: TypeSafe Jev vs a structured-output LLM on the same intent set. Pick CLINC150, BANKING77, or HWU64, and GPT-4.1, GPT-4.1 mini, or GPT-5.6 Sol.

## Local setup

1. Copy `.env.example` to `.env.local` if needed, then paste:
   - `TYPESAFE_API_KEY`
   - `OPENAI_API_KEY`
2. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000

Public URL: https://www.rohitpathak.com/how-good-is-jev

## What is scored

Exact match to the canonical intent for the selected dataset. Domains are for grouping only. Headline numbers use the held-out test split. Different model/dataset pairs are not comparable to each other.

## Railway

This app is a separate Railway service. The personal site proxies `/how-good-is-jev` to it.

Set the same environment variables as `.env.example`, plus:

- `NEXT_PUBLIC_BASE_PATH=/how-good-is-jev` (needed at **build** time)

Start command: `npm run start`. Health check: `/how-good-is-jev/api/health`.

On the resume-site service, set `JEV_APP_URL` to this service’s public URL (no trailing slash).

## Datasets

See `data/ATTRIBUTION.md`. Rebuild extras with `npm run normalize-datasets`.
