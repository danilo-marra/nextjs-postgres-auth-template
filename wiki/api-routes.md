# API Routes

**Summary**: All HTTP endpoints, their methods, required features, and what they do.

**Sources**: pages/api/v1/

**Last updated**: 2026-06-07

---

All routes live under `pages/api/v1/` and are wrapped with next-connect controllers.

## Endpoints

### Users

| Method  | Path                       | Feature required | Action                         |
| ------- | -------------------------- | ---------------- | ------------------------------ |
| `POST`  | `/api/v1/users`            | `create:user`    | Register new user              |
| `GET`   | `/api/v1/users/[username]` | `read:user`      | Get public user profile        |
| `PATCH` | `/api/v1/users/[username]` | `update:user`    | Update username/email/password |

### Sessions

| Method   | Path               | Feature required | Action                 |
| -------- | ------------------ | ---------------- | ---------------------- |
| `POST`   | `/api/v1/sessions` | `create:session` | Login (sets cookie)    |
| `DELETE` | `/api/v1/sessions` | `read:session`   | Logout (clears cookie) |

### Current user

| Method | Path           | Feature required | Action                           |
| ------ | -------------- | ---------------- | -------------------------------- |
| `GET`  | `/api/v1/user` | `read:user:self` | Get own profile (includes email) |

### Activation

| Method  | Path                             | Feature required        | Action                     |
| ------- | -------------------------------- | ----------------------- | -------------------------- |
| `PATCH` | `/api/v1/activations/[token_id]` | `read:activation_token` | Activate account via token |

### Password reset

| Method  | Path                                | Feature required              | Action              |
| ------- | ----------------------------------- | ----------------------------- | ------------------- |
| `POST`  | `/api/v1/password/reset`            | `create:password_reset_token` | Request reset email |
| `PATCH` | `/api/v1/password/reset/[token_id]` | `read:password_reset_token`   | Set new password    |

### Infrastructure

| Method | Path                 | Feature required   | Action                  |
| ------ | -------------------- | ------------------ | ----------------------- |
| `GET`  | `/api/v1/status`     | `read:status`      | DB health check         |
| `GET`  | `/api/v1/migrations` | `read:migration`   | List pending migrations |
| `POST` | `/api/v1/migrations` | `create:migration` | Run pending migrations  |

## Related pages

- [[auth-flow]]
- [[rbac]]
- [[error-handling]]
- [[migrations]]
