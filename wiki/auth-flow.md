# Auth Flow

**Summary**: End-to-end user lifecycle — registration, email activation, login, and logout.

**Sources**: models/user.js, models/activation.js, models/session.js, pages/api/v1/users/index.js, pages/api/v1/activations/, pages/api/v1/sessions/index.js

**Last updated**: 2026-06-07

---

## Registration

1. `POST /api/v1/users` — creates a user with hashed password and default features `["read:activation_token"]`
2. An activation token (15-minute expiry) is created and emailed to the user
3. The account is not yet usable — the user cannot log in until activated

## Activation

1. User clicks the link in the email: `PATCH /api/v1/activations/[token_id]`
2. Token is validated (not expired, not used)
3. Token is marked as used (`used_at` set)
4. User features are replaced with `["create:session", "read:session", "update:user"]`
5. Account is now active

## Login

1. `POST /api/v1/sessions` — validates credentials (username + password via bcryptjs)
2. On success, a session row is inserted with a 96-char hex token and 30-day expiry
3. `session_id` httpOnly cookie is set on the response via `controller.setSessionCookie`

## Logout

1. `DELETE /api/v1/sessions` — expires the current session by subtracting 1 year from `expires_at`
2. `session_id` cookie is cleared via `controller.clearSessionCookie`

## Password Reset

See [[password-reset]] for the full flow.

## Feature progression

| State           | Features                                            |
| --------------- | --------------------------------------------------- |
| Just registered | `["read:activation_token"]`                         |
| Activated       | `["create:session", "read:session", "update:user"]` |
| Admin (manual)  | any additional features via `user.addFeatures`      |

## Related pages

- [[session]]
- [[rbac]]
- [[password-reset]]
- [[activation]]
- [[api-routes]]
