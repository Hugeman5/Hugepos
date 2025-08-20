# chore: migrate AI brief to `blueprint.md` and rename scaffolding script

## Why
- Standardize on a single source of truth: `blueprint.md` in repo root.
- Remove legacy `docs/AI_BRIEF.md` and `scripts/apply_ai_brief.sh` to prevent drift.
- Align Gemini/Copilot prompts and docs to the same filename.

## What changed
- Added `scripts/apply_blueprint.sh` (idempotent) to generate:
  - `blueprint.md`
  - `.cursorrules`
  - `docs/GEMINI_PROMPT.md`
  - `docs/SANITY_CHECKS.md`
- Removed legacy files:
  - `docs/AI_BRIEF.md`
  - `scripts/apply_ai_brief.sh`
- Rewrote in-repo references: `AI_BRIEF.md` → `blueprint.md`, old script → new script.

## Acceptance Criteria
- [ ] No references to `docs/AI_BRIEF.md` remain (`git grep -n AI_BRIEF` returns nothing).
- [ ] No references to `scripts/apply_ai_brief.sh` remain.
- [ ] Dev server still runs on port 6012.
- [ ] Gemini/Copilot prompts render and reference `blueprint.md`.

## Sanity
```bash
bash scripts/apply_blueprint.sh
npm run dev:6012
curl -s http://localhost:6012/api/mock-auth/active-users
curl -s http://localhost:6012/api/register/status
```
