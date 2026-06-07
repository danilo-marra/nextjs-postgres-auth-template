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
