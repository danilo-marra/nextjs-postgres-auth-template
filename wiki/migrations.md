# Migrations

**Summary**: Database schema migration system — files, commands, and the tables they create.

**Sources**: infra/migrations/, models/migrator.ts, package.json

**Last updated**: 2026-06-08

---

Migrations use `node-pg-migrate` and live in `infra/migrations/`. Files are named with a Unix timestamp prefix.

## Commands

```bash
npm run migrations:create   # scaffold new migration file
npm run migrations:up       # apply pending migrations
npm run migrations:up:dry   # dry-run (show SQL without executing)
npm run migrations:status   # list pending migrations
```

Migrations are also applied automatically at dev startup (`npm run dev`) and accessible via API for programmatic use.

## Migration files

| File                                             | Creates                        |
| ------------------------------------------------ | ------------------------------ |
| `1740051316822_create-users.js`                  | `users` table                  |
| `1749131251522_create-sessions.js`               | `sessions` table               |
| `1758546392118_add-features-to-users.js`         | `features` column on `users`   |
| `1760615585369_create-user-activation-tokens.js` | `user_activation_tokens` table |
| `1780851141185_create-password-reset-tokens.js`  | `password_reset_tokens` table  |

## Schema summary

**users**: `id`, `username`, `email`, `password` (bcrypt), `features` (text[]), `created_at`, `updated_at`

**sessions**: `id`, `token`, `user_id`, `expires_at`, `created_at`, `updated_at`

**user_activation_tokens**: `id`, `user_id`, `expires_at`, `used_at`, `created_at`, `updated_at`

**password_reset_tokens**: `id`, `user_id`, `expires_at`, `used_at`, `created_at`, `updated_at`

## Migration files stay as `.js`

`infra/migrations/*.js` are CommonJS files loaded by `node-pg-migrate` via `require()`. They are excluded from TypeScript compilation (`tsconfig.json` `exclude` list) and from ESLint. Do not rename them to `.ts`.

`models/migrator.ts` wraps the runner; its return type is inferred (the runner's `RunMigration` type is not exported from the public package index).

## Rule

Always run `migrations:up` and verify before opening a PR. Never hand-edit the DB schema outside of migration files.

## Related pages

- [[database]]
- [[api-routes]]
- [[overview]]
