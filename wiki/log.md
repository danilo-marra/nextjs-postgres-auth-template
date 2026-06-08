# Wiki Log

Append-only record of all wiki operations.

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
