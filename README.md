# Venue Risk Intelligence (VRI)

AI-assisted crowd safety risk monitoring for large venues — built for operations directors, compliance officers, and insurers.

## What it does

VRI fuses three real-time signal streams — heat exposure, crowd density, and egress utilization — into a deterministic risk classification per zone. A Gemini LLM then writes a plain-language narrative summarizing the risk state for the ops team.

**Key design constraint (rules.md rule 2):** Gemini never classifies risk. It only narrates a pre-computed `riskLevel` from the deterministic rules engine. All classification is auditable, reproducible, and threshold-based.

## Personas

| Role | View | What they see |
|---|---|---|
| `ops_director` | `/dashboard` | Live zone card grid — risk badges, Gemini narratives, 60s auto-refresh |
| `compliance_officer` | `/certification` | Interactive rubric checklist — Met/Needs Evidence/Not Met per item, live score |
| `insurer` | `/benchmark` | Anonymized peer-vs-venue bar chart, hazard toggles |

## Required environment variables

Create a `.env.local` file in `vri-app/` (already gitignored):

```bash
# .env.local
GEMINI_API_KEY=your_google_ai_studio_key_here
```

Get a free key at [aistudio.google.com](https://aistudio.google.com).

If `GEMINI_API_KEY` is absent or the API call fails, the app falls back to rule-based template narratives and marks them visibly as **"template fallback"** in the UI — it never silently serves fake AI output.

> No other API keys are needed. Heat data comes from [Open-Meteo](https://open-meteo.com/) (free, no key). All other data is synthetic/seeded in-memory.

## Running locally

```bash
cd "challenge 4/vri-app"
npm install
npm run dev
```

App is available at **http://localhost:3000**.

On first load, `GET /api/seed` initializes the in-memory store with a demo venue (Riverside Arena) and 4 zones. The seed runs automatically — no manual step needed.

## Demo mode

On the dashboard, click **Demo mode** to enable an escalating-risk scenario: zone signals ramp from Normal → Elevated → High over ~30 ticks. Click it again to reset.

## Functional vs. demo-stub features

| Feature | Status |
|---|---|
| Deterministic risk classification | ✅ Fully functional |
| Gemini narrative generation (server-side) | ✅ Functional (needs valid API key) |
| Template fallback when Gemini fails | ✅ Fully functional |
| AI vs. template label in UI | ✅ Functional |
| Dashboard zone card grid | ✅ Functional |
| Zone detail drawer with signal readouts | ✅ Functional |
| Acknowledge read-receipt (persisted) | ✅ Functional (in-memory, resets on restart) |
| Demo escalation mode | ✅ Functional |
| Certification rubric (interactive, live score) | ✅ Functional |
| Audit submission | ✅ Functional (in-memory) |
| Benchmark chart | ✅ Functional (seeded mock peer data) |
| Authentication | ⚠️ Mock only — localStorage role, no server-side auth |
| Data persistence across restarts | ⚠️ In-memory only — resets on `npm run dev` restart |
| Multi-venue support | ⚠️ Single demo venue hardcoded |

## Running tests

```bash
npm test
# or for just the classification logic:
npx jest lib/signals/fusionService.test.ts
```

Tests cover all threshold boundary conditions for `classifyRiskLevel()` and `computeTrend()` — the core trust-critical functions that the whole safety contract depends on.

## Architecture

```
Browser → Next.js API Routes → Signal Pipeline → In-memory Store
                                    ↓
                           fusionService.ts  ← deterministic rules
                                    ↓
                        narrativeGenerator.ts ← Gemini (language only)
```

See [`files/techspec.md`](../files/techspec.md) and [`files/prd.md`](../files/prd.md) for full context.

## Project rules (summary)

1. **No prescriptive actions** — the UI describes risk state; it never tells staff what to do.
2. **Gemini = language only** — risk classification is always deterministic threshold rules.
3. **Fail loudly** — if Gemini fails, show "narrative unavailable" + raw signal data, clearly labelled.
4. **API key server-side only** — `GEMINI_API_KEY` never reaches the client bundle.
5. **Partition by venueId** — all queries scoped; no cross-venue data leakage.

See [`files/rules.md`](../files/rules.md) for the full set of constraints.
