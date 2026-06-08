# Overview

**Summary**: High-level description of the project — what it is, what it provides, and how the pieces fit together.

**Sources**: CLAUDE.md, package.json, README.md

**Last updated**: 2026-06-07

---

`nextjs-postgres-auth-template` is a production-ready starter template for web applications that need authentication out of the box. It is intentionally minimal: no ORM, no TypeScript, no app router — just raw SQL, plain JavaScript, and well-defined conventions.

## What it provides

- User registration with email activation
- httpOnly cookie sessions (30-day expiry)
- Feature-based RBAC (not role-based)
- Password reset via email
- Integration test suite against a real database
- Docker-based local development with one command

## Stack

| Layer      | Choice                               |
| ---------- | ------------------------------------ |
| Framework  | Next.js 15, Pages Router             |
| Language   | JavaScript (no TypeScript)           |
| Database   | PostgreSQL 16 via raw `pg` queries   |
| Migrations | node-pg-migrate                      |
| Auth       | bcryptjs passwords, httpOnly cookies |
| Email      | Nodemailer                           |
| Testing    | Jest + integration tests only        |
| Dev infra  | Docker Compose                       |

## Entry points

- `npm run dev` — starts Docker, waits for Postgres, runs migrations, starts Next.js
- `npm test` — same but runs the full Jest suite instead
- `pages/api/v1/` — all API routes
- `infra/controller.js` — request middleware: injects user, enforces RBAC, normalizes errors

## Related pages

- [[auth-flow]]
- [[rbac]]
- [[session]]
- [[database]]
- [[api-routes]]
- [[migrations]]
- [[error-handling]]
