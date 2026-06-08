# Activation

**Summary**: Email-based account activation flow — token creation, delivery, and feature grant on use.

**Sources**: models/activation.js, pages/api/v1/activations/

**Last updated**: 2026-06-07

---

New users start with only `["read:activation_token"]` and cannot log in until their account is activated.

## Flow

1. User registers → `POST /api/v1/users`
2. Activation token created (`user_activation_tokens`) with 15-minute expiry
3. Email sent to user with link `{PRODUCTION_URL}{ACTIVATION_PATH}/{token.id}`
4. User clicks link → `PATCH /api/v1/activations/[token_id]`
5. Token validated (not expired, not used)
6. Token marked as `used_at`
7. User features replaced with `["create:session", "read:session", "update:user"]`

## Token details

- Expiry: `60 * 15 * 1000` ms (15 minutes)
- Single-use (`used_at IS NULL` check)
- Stored as UUID in `user_activation_tokens`

## Guard: already-activated users

Before granting features, `activateUserByUserId` checks that the user still has `read:activation_token`. If they don't (already activated), it throws `ForbiddenError`. This prevents double-activation.

## Email content

Plain-text email with subject `Activate your account on {APP_NAME}`.

`ACTIVATION_PATH` defaults to `/activate` if not set.

## Related pages

- [[auth-flow]]
- [[rbac]]
- [[api-routes]]
