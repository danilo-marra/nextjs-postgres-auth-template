# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- Next.js 14 **Pages Router** (not App Router) — JavaScript only, no TypeScript
- PostgreSQL 16 via raw `pg` queries (no ORM)
- node-pg-migrate for SQL migrations
- Custom httpOnly cookie sessions (30-day, bcryptjs passwords)
- Feature-based RBAC via `infra/controller.js` + `models/authorization.js`
- next-connect for per-route middleware chains

## Dev Setup

Requires Docker. `npm run dev` starts Docker services, waits for Postgres, runs pending migrations, then starts Next.js — all in one command. Do not run sub-steps manually unless debugging.

```bash
npm run dev          # full dev stack
npm run services:up  # Docker only (if needed separately)
npm run migrations:up  # apply pending migrations
```

## Testing

Integration tests only — no unit tests. Tests hit a real database.

```bash
npm test                          # full suite (starts/stops services automatically)
npx jest tests/integration/api/v1/users/ --runInBand  # single folder
npx jest -t "test name"           # by test name pattern
```

Jest timeout is 6 seconds. Tests use `tests/orchestrator.js` for DB reset and test factories.

## Database & Migrations

Raw parameterized SQL in `models/`. No ORM — do not add one.

```bash
npm run migrations:create  # scaffold a new migration file in infra/migrations/
npm run migrations:up      # apply pending
npm run migrations:status  # check what's pending
npm run migrations:up:dry  # dry-run
```

Migration files live in `infra/migrations/`. Always run `migrations:up` and test before opening a PR.

## Auth & RBAC

- New users register → activation email → click link → login
- Sessions are httpOnly cookies; session token is in the DB
- RBAC is **feature-based** (not role-based): each user has a `features` array (e.g., `["read:user:self", "create:session"]`)
- Anonymous users default to `["read:activation_token", "create:session", "create:user"]`
- Enforce with: `controller.canRequest("feature:name")` middleware
- Filter output with: `authorization.filterOutput(user, "feature:name", resource)`

## Code Style

- 2-space indentation (EditorConfig)
- Prettier defaults (no .prettierrc overrides)
- ESLint: `eslint:recommended` + `plugin:jest/recommended` + `next/core-web-vitals`
- Run before committing: `npm run lint:prettier:fix && npm run lint:eslint:check`
- **Conventional Commits** enforced by commitlint + Husky: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`

## Branch & PR Conventions

- Never commit directly to `main` — always use a feature branch
- Tests must pass before merging
- Migrations must be applied and tested before opening a PR
- Use `npm run commit` for interactive conventional-commit message help

## Environment Variables

Development values are in `.env.development` (auto-loaded). For production, set all `POSTGRES_*`, `EMAIL_SMTP_*`, `APP_EMAIL`, `APP_NAME`, and `PRODUCTION_URL`. Optionally set `POSTGRES_CA` for SSL. See `.env.example` for the full list.

## Infra Layout

- `infra/controller.js` — request middleware: injects user, enforces RBAC, normalizes errors
- `infra/database.js` — pg client wrapper
- `infra/email.js` — Nodemailer transport
- `infra/errors.js` — typed error hierarchy (use these, don't throw plain Errors)
- `models/` — business logic with raw SQL
- `pages/api/v1/` — API routes, all wrapped with next-connect controllers

## Knowledge Base

Two folders at the repo root manage project documentation:

- `raw/` — source documents (immutable — never modify these)
- `wiki/` — markdown pages maintained by Claude
- `wiki/index.md` — table of contents for the entire wiki
- `wiki/log.md` — append-only record of all operations

### Ingest workflow

When a new source is added to `raw/` and ingestion is requested:

1. Read the full source document
2. Discuss key takeaways with the user before writing anything
3. Create a summary page in `wiki/` named after the source
4. Create or update concept pages for each major idea or entity
5. Add wiki-links (`[[page-name]]`) to connect related pages
6. Update `wiki/index.md` with new pages and one-line descriptions
7. Append an entry to `wiki/log.md` with the date, source name, and what changed

A single source may touch 10–15 wiki pages. That is normal.

### Page format

Every wiki page must follow this structure:

```markdown
# Page Title

**Summary**: One to two sentences describing this page.

**Sources**: List of raw source files this page draws from.

**Last updated**: Date of most recent update.

---

Main content goes here. Use clear headings and short paragraphs.

Link to related concepts using [[wiki-links]] throughout the text.

## Related pages

- [[related-concept-1]]
- [[related-concept-2]]
```

### Citation rules

- Every factual claim should reference its source file
- Use the format `(source: filename.pdf)` after the claim
- If two sources disagree, note the contradiction explicitly
- If a claim has no source, mark it as needing verification

### Question answering

When the user asks a question:

1. Read `wiki/index.md` first to find relevant pages
2. Read those pages and synthesize an answer
3. Cite specific wiki pages in the response
4. If the answer is not in the wiki, say so clearly
5. If the answer is valuable, offer to save it as a new wiki page

Good answers should be filed back into the wiki so they compound over time.

### Wiki lint

When asked to lint or audit the wiki:

- Check for contradictions between pages
- Find orphan pages (no inbound links from other pages)
- Identify concepts mentioned in pages that lack their own page
- Flag claims that may be outdated based on newer sources
- Check that all pages follow the page format above
- Report findings as a numbered list with suggested fixes

### Rules

- Never modify anything in `raw/`
- Always update `wiki/index.md` and `wiki/log.md` after changes
- After every merge into `main`, review what changed and update any affected wiki pages; append a merge entry to `wiki/log.md` with the date, PR/branch name, and a summary of what changed
- Keep page names lowercase with hyphens (e.g. `machine-learning.md`)
- Write in clear, plain language
- When uncertain about how to categorize something, ask the user
