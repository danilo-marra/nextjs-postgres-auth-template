# Wiki Index

Table of contents for the project knowledge base.

---

## Core

- [overview](overview.md) — What this project is, the full stack, and how to run it
- [api-routes](api-routes.md) — All HTTP endpoints, methods, required features, and actions

## Auth

- [auth-flow](auth-flow.md) — Registration, activation, login, and logout end-to-end
- [activation](activation.md) — Email-based account activation and feature grant
- [password-reset](password-reset.md) — Password reset flow with atomic transaction
- [session](session.md) — Session creation, validation, renewal, and expiry

## Authorization

- [rbac](rbac.md) — Feature-based authorization: available features, anonymous users, output filtering

## Infrastructure

- [database](database.md) — pg Pool configuration, query helpers, SSL, and transaction pattern
- [migrations](migrations.md) — Migration files, commands, and schema summary
- [error-handling](error-handling.md) — Typed error hierarchy and controller error flow
- [typescript](typescript.md) — tsconfig decisions, key type exports, and migration caveats
