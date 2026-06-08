# Password Reset

**Summary**: Full password reset flow — how tokens are created, emailed, validated, and consumed.

**Sources**: models/password-reset.js, pages/api/v1/password/reset/

**Last updated**: 2026-06-07

---

## Flow

1. `POST /api/v1/password/reset` — user submits their email
2. If the email exists, a `password_reset_tokens` row is created (1-hour expiry) and the reset link is emailed
3. If the email does not exist, the endpoint returns silently (no error, no leak)
4. User clicks the link: `PATCH /api/v1/password/reset/[token_id]`
5. Token is claimed atomically in a transaction:
   - Token validated (not expired, not used) and marked `used_at`
   - Password hashed and updated on the user row
   - **All sessions for that user are deleted** (forces re-login everywhere)

## Token details

- Expiry: `60 * 60 * 1000` ms (1 hour)
- Stored as a UUID in `password_reset_tokens`
- Single-use (`used_at IS NULL` check)

## Email content

Plain-text email with subject `Reset your password on {APP_NAME}` and a link to `{PRODUCTION_URL}{PASSWORD_RESET_PATH}/{token.id}`.

`PASSWORD_RESET_PATH` defaults to `/password/reset` if not set.

## Transaction safety

`resetPassword` uses a dedicated `pg` client with `BEGIN / COMMIT / ROLLBACK` so the password update and session wipe are atomic. If either fails, neither is committed.

## Related pages

- [[auth-flow]]
- [[session]]
- [[database]]
- [[api-routes]]
