#!/usr/bin/env bash
set -euo pipefail

root_dir="$(pwd)"
mkdir -p "$root_dir/docs"

# blueprint.md (root)
cat > "$root_dir/blueprint.md" << 'EOF'
# HugePOS – AI Blueprint (keep pinned for Copilot/Cursor)

## Core rules
- Auth + users: local-only. No Firebase. Data lives in /data/*.json. Do not add onSnapshot/httpsCallable/etc.
- Currency: ZAR (“R ”), default locale en-ZA. VAT = 15% unless overridden per supplier item.
- Ports: dev runs on 6012 (Workstations proxy also exposes 6000/9000).
- Single sources of truth (local JSON):
  - Users:           data/users.json  (id, name, role, active, exposeOnPinLogin, pin or pinHash)
  - Menu:            data/menu.json   (items, categories, modifierSets, taxCodes)
  - Orders:          data/orders.json (open carts, tickets, payments)
  - KDS:             read from /api/kds (built from orders)
  - Suppliers:       data/suppliers.json + catalog CSV imports -> data/ingredients.json
  - Ingredients:     data/ingredients.json (purchaseUom, purchaseSize, priceIncVat/exVat, vatRate)
  - Recipes:         data/recipes.json (bom links, yield, overhead, packaging, targetGpPct)
  - Register:        data/register.json (current shift, history, cash movements, paymentSummary)

## Critical endpoints (local-only)
- Login:       GET /api/mock-auth/active-users  | POST /api/mock-auth/verify {identifier,pin}
- Menu/Admin:  /api/admin/menu, /api/admin/users
- Orders:      /api/orders/add-line, /api/orders/line, /api/orders/send (and computeLine uses full menu)
- KDS:         GET /api/kds   (not /api/kds/tickets)
- Register:    /api/register/status, /open, /close, /move   (recordPayment called on order pay)
- Suppliers:   /api/suppliers, /api/suppliers/catalog/upload (CSV), /api/ingredients

## Math/costing
- Use lib/uom.ts for unit conversions (g/kg, ml/l, ea). Normalize UoM before math.
- Cost = prorated by qty & UoM from supplier unit price. Respect waste%.
- Recipe totals: baseCost (sum inc VAT), + packaging, + overhead%; suggest RSP from target GP% then add VAT.
- Use lib/money.formatMoney(value, {currency:'ZAR', locale:'en-ZA'}) everywhere.

## UX
- Lightspeed-like: dark, clean, big targets.
- PIN login: select user → 4-digit keypad → route by role.
- Admin: categories, items, modifiers, suppliers+catalog import, ingredients, recipes (BOM), users & rates, KDS stations.
- Waiter/Cashier: menu grid → cart → send to KDS → pay (register must be OPEN).
- KDS: station filters, bump/expedite, tickets grouped.

## Guard rails
- Do **not** introduce Firebase/Firestore/AppCheck.
- If an action needs persistence, write to /data JSON via a repo module then an /api/* route.
- Keep existing endpoints & types stable; if you must change, update both client + route + repo.
EOF

# .cursorrules
cat > "$root_dir/.cursorrules" << 'EOF'
- Never add Firebase or remote services. Use /data/*.json + Node fs.
- All money shows ZAR with “R ” and en-ZA formatting.
- VAT defaults to 15%.
- Do not change existing route paths; extend them if needed.
- If you touch costing, use lib/uom.ts and lib/costing.ts.
- If you add a page, protect it with existing session/role guards.
EOF

# docs/GEMINI_PROMPT.md
cat > "$root_dir/docs/GEMINI_PROMPT.md" << 'EOF'
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
EOF

# docs/SANITY_CHECKS.md
cat > "$root_dir/docs/SANITY_CHECKS.md" << 'EOF'
# HugePOS – Sanity Checks

```bash
curl -s http://localhost:6012/api/mock-auth/active-users | jq .

curl -s -X POST http://localhost:6012/api/mock-auth/verify \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"eugene","pin":"5245"}' | jq .

curl -s http://localhost:6012/api/register/status | jq .
```
EOF

echo "\n✅ Wrote/updated: blueprint.md, .cursorrules, docs/GEMINI_PROMPT.md, docs/SANITY_CHECKS.md"
EOS