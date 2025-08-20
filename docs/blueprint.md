# HugePOS – AI Brief (keep pinned for Copilot/Cursor)

Core rules
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

Critical endpoints (local-only)
- Login:       GET /api/mock-auth/active-users  | POST /api/mock-auth/verify {identifier,pin}
- Menu/Admin:  /api/admin/menu, /api/admin/users
- Orders:      /api/orders/add-line, /api/orders/line, /api/orders/send (and computeLine uses full menu)
- KDS:         GET /api/kds   (not /api/kds/tickets)
- Register:    /api/register/status, /open, /close, /move   (recordPayment called on order pay)
- Suppliers:   /api/suppliers, /api/suppliers/catalog/upload (CSV), /api/ingredients

Math/costing
- Use lib/uom.ts for unit conversions (g/kg, ml/l, ea). Normalize UoM before math.
- Cost = prorated by qty & UoM from supplier unit price. Respect waste%.
- Recipe totals: baseCost (sum inc VAT), + packaging, + overhead%; suggest RSP from target GP% then add VAT.
- Use lib/money.formatMoney(value, {currency:'ZAR', locale:'en-ZA'}) everywhere.

UX
- Lightspeed-like: dark, clean, big targets.
- PIN login: select user → 4-digit keypad → route by role.
- Admin: categories, items, modifiers, suppliers+catalog import, ingredients, recipes (BOM), users & rates, KDS stations.
- Waiter/Cashier: menu grid → cart → send to KDS → pay (register must be OPEN).
- KDS: station filters, bump/expedite, tickets grouped.

Guard rails
- Do **not** introduce Firebase/Firestore/AppCheck.
- If an action needs persistence, write to /data JSON via a repo module then an /api/* route.
- Keep existing endpoints & types stable; if you must change, update both client + route + repo.
