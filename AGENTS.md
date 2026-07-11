# AGENTS.md — VRI Project Rules for AI Coding Assistants

This file encodes the hard constraints that govern this codebase. Any AI coding session
pointed at this repo must be able to state these rules and follow them without being told separately.

---

## Rule 1 — No prescriptive actions (CRITICAL)

The UI and narratives must **never** tell users what action to take.
- ✅ OK: "Crowd density at Gate A is at 87% of modelled capacity."
- ❌ NEVER: "You should close Gate A." / "Consider redirecting crowd flow." / "We recommend..."
- This applies to every string in the codebase — buttons, narrative text, tooltips, error messages, onboarding.
- The "Mark reviewed" button is a read-receipt, NOT an acknowledgement of a recommendation.

## Rule 2 — Gemini narrates; rules classify (CRITICAL)

Risk level (`normal`, `elevated`, `high`) is computed by `lib/signals/fusionService.ts` using
deterministic threshold rules. The LLM's **only** job is to turn that pre-classified signal into
a plain-language sentence.

- Never pass `riskLevel` to Gemini and ask it to decide if conditions are safe or unsafe.
- Never let Gemini suggest or compute thresholds.
- The system prompt in `narrativeGenerator.ts` is pinned — do not loosen it.

## Rule 3 — Claim traceability

Every sentence in a narrative must trace to a field in the signal snapshot.
Gemini must not speculate beyond `heatIndex`, `crowdDensity`, `egressUtilization`, `trend`, and `riskLevel`.

## Rule 4 — API key server-side only

`GEMINI_API_KEY` lives only in `.env.local` and is accessed only inside `app/api/**` routes.
It must never appear in any client-side bundle, `use client` file, or be passed via URL param.

## Rule 5 — Partition by venueId

All data reads and writes must be scoped to a `venueId`. No query may return data across venues.
This is enforced in `lib/store/memoryStore.ts` — maintain this invariant in any new store functions.

## Rule 6 — Fail loudly

If Gemini fails:
- Set `generationFailed: true` on the `RiskNarrative` object.
- The UI must show "narrative unavailable" + the raw signal values.
- `generatedBy` must be `'mock-rules-v1-fallback'` (not `'gemini-*'`).
- The source label in `NarrativePanel` must visibly say "template fallback" (not silently serve it).

## Rule 7 — Narrative is the primary product

`NarrativePanel` is the central UI element. Raw signal numbers are secondary.
Design decisions must keep the narrative readable and prominent.

## Rule 8 — 60-second minimum refresh

Client-side auto-refresh must not poll faster than 60 seconds.
The manual "Refresh" button is the only way to trigger an immediate update.
Do not add WebSocket or SSE connections without explicit approval.

## Rule 9 — No cross-zone data in narratives

Each narrative is scoped to a single zone. Never mix data from multiple zones in one narrative call.

---

## Architecture constraints

- **Stack:** Next.js 14+ App Router, TypeScript strict mode, Tailwind CSS, Recharts
- **Auth:** Currently mock (localStorage). Any real auth must use server-verified session tokens; roles must be checked server-side in API routes.
- **Store:** `lib/store/memoryStore.ts` — keep function signatures stable. Future Firestore migration must be a drop-in for the same exported functions.
- **Signal pipeline:** `syntheticGenerator → heatIndexFetcher → fusionService → narrativeGenerator`. Do not bypass this order.

## Testing requirements

- `lib/signals/fusionService.test.ts` must pass before any PR that changes classification thresholds.
- Tests must cover all three threshold boundaries for each hazard type (heat/crowd/egress).
- `npm run lint` must return 0 errors.

## Files not to modify without review

- `lib/narrative/narrativeGenerator.ts` — system prompt and `generationFailed` logic
- `lib/signals/fusionService.ts` — classification thresholds
- `files/rules.md` — source of truth for all the above
