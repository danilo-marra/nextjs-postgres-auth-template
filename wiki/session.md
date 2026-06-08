# Session

**Summary**: How sessions are created, stored, validated, and expired.

**Sources**: models/session.js, infra/controller.js

**Last updated**: 2026-06-07

---

Sessions are stored in a `sessions` table and identified by a 96-character hex token (`crypto.randomBytes(48).toString("hex")`).

## Lifecycle

| Operation  | Method                               | Notes                                              |
| ---------- | ------------------------------------ | -------------------------------------------------- |
| Create     | `session.create(userId)`             | Inserts row, sets `expires_at = now + 30 days`     |
| Validate   | `session.findOneValidByToken(token)` | Throws `UnauthorizedError` if expired or not found |
| Renew      | `session.renew(sessionId)`           | Extends `expires_at` by another 30 days            |
| Expire     | `session.expireById(sessionId)`      | Subtracts 1 year from `expires_at` (soft delete)   |
| Delete all | `session.deleteAllByUserId(userId)`  | Used during password reset                         |

## Cookie

The session token is transported as an httpOnly cookie named `session_id`.

- `maxAge`: 30 days (in seconds)
- `secure`: true in production
- `httpOnly`: true always

Set via `controller.setSessionCookie`. Cleared via `controller.clearSessionCookie` (sets `maxAge: -1`).

## Request injection

`controller.injectAnonymousOrUser` runs on every request:

1. If `session_id` cookie is present → looks up session + user → injects into `request.context.user`
2. If session not found or expired → throws `UnauthorizedError` (which also clears the cookie)
3. If no cookie → injects anonymous user object (see [[rbac]])

## Expiry constant

`EXPIRATION_IN_MILISECONDS = 60 * 60 * 24 * 30 * 1000` (30 days)

## Related pages

- [[auth-flow]]
- [[rbac]]
- [[database]]
