# Wiki Log

Append-only record of all wiki operations.

---

## 2026-07-01 — PR #13 merge: clean up leftover placeholders from a different project

**Branch**: chore/cleanup-old-project-placeholders

**What changed**: Renamed the `mailcatcher` Docker container (`infra/compose.yaml`) so it stops colliding with an unrelated project's leftover container of the same name; fixed a test sender address in `tests/integration/infra/email.test.ts` that referenced another project's domain; removed a stray dev script (`watch_status.bat`) pointing at another project's URL and two empty debris files (`-d`, `-H`); added a `.claude/skills/ship` skill that chains commit → PR → code review → CI checks → merge → wiki-sync.

No wiki pages required updates — none of the changed files (Docker container naming, a test fixture string, tooling debris, a Claude Code skill) are referenced by any existing page.

Wiki lint findings from this pass (unrelated to PR #13, carried over from an earlier gap):

- `activation.md`, `auth-flow.md`, `password-reset.md`, `session.md` — Sources lines still reference `.js` files that are now `.ts` (missed by the TypeScript migration sync below). Needs a follow-up pass.
- Root `CLAUDE.md` says "Next.js 14" but `package.json` and `overview.md` say Next.js 15 — needs a fix outside `wiki/`.

---

## 2026-06-08 — PR #10 merge: JavaScript → TypeScript migration

**Branch**: feat/typescript-migration

**What changed**: All source files renamed `.js`/`.jsx` → `.ts`/`.tsx`. `tsconfig.json` added with `strict: true`. ESLint updated with `@typescript-eslint`. Migration files in `infra/migrations/` remain as `.js`.

Wiki pages updated:

- `overview.md` — language now TypeScript; added `typecheck` entry point; `.js` → `.ts` in controller reference
- `database.md` — source updated to `.ts`; documented generic `query<T>()` pattern
- `migrations.md` — source updated to `.ts`; added note that migration files stay `.js` and why
- `error-handling.md` — source references updated to `.ts`
- `rbac.md` — source references updated to `.ts`; added `Feature` union type and `ContextUser` / `AnonymousUser` types

Wiki pages created:

- `typescript.md` — tsconfig decisions, key type exports (`Feature`, `UserRow`, `AppApiRequest`, `query<T>()`), ESLint exclusions, and migration caveats

---

## 2026-06-07 — Initial population

**Branch**: docs/knowledge-base-setup

**What changed**: Wiki created from scratch based on codebase inspection. No raw sources ingested yet — content derived from reading source files directly.

Pages created:

- `overview.md` — project description, stack, entry points
- `auth-flow.md` — registration → activation → login → logout lifecycle
- `activation.md` — activation token flow and feature grant
- `password-reset.md` — password reset with atomic transaction
- `session.md` — session model, cookie, and request injection
- `rbac.md` — feature-based authorization, anonymous users, output filtering
- `database.md` — pg pool, query helpers, SSL config, transaction pattern
- `migrations.md` — migration files, commands, schema summary
- `error-handling.md` — typed error hierarchy and controller error handling
- `api-routes.md` — all endpoints with methods, features, and actions
- `index.md` — this table of contents
