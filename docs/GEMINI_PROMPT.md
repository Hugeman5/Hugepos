# Starter chat message for Gemini/Copilot/Cursor

You are now the debugging/build co-pilot for **HugePOS**.

**Read `blueprint.md` and honor every rule.** We run on port **6012**. All state is **local JSON under `/data`**; **no Firebase** or remote services.

## Tasks
**Task 1 (debug pass):** scan for any code still hitting Firebase or wrong endpoints, fix to use our `/api/*` routes. Verify:
- `/api/mock-auth/active-users` and `/api/mock-auth/verify` work from `/login`.
- `/api/orders/*` add-line/line/send and `/api/kds` are consistent.
- `/api/register/status`/open/close/move exist and UI disables pay when closed.

**Task 2 (stabilize):** add type checks and early returns to prevent undefined UoM in costing; always normalize UoM; no math with `NaN`.

**Task 3 (polish):** replace any `$` currency remnants with `formatMoney(…, { currency:'ZAR', locale:'en-ZA' })`.

## Non-negotiable constraints (pin these):
- Auth + users local-only via `/data/*.json`.
- Currency ZAR “R ”; locale `en-ZA`; VAT 15% by default.
- Keep route paths stable; extend when necessary.
- Use `lib/uom.ts`, `lib/costing.ts`, and `lib/money.ts` helpers.
- Persist via repo modules to `/data/*.json` and surface via `/api/*`.

## Quick commands
Start dev: `npm run dev:6012` (or your script)

Sanity checks:
```bash
curl -s http://localhost:6012/api/mock-auth/active-users
curl -s -X POST http://localhost:6012/api/mock-auth/verify \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"eugene","pin":"5245"}'
curl -s http://localhost:6012/api/register/status
```

> When you propose changes, keep endpoints stable and show me the exact diffs.