# RBAC

**Summary**: Feature-based authorization system — how permissions are stored, checked, and applied to filter output.

**Sources**: models/authorization.js, infra/controller.js

**Last updated**: 2026-06-07

---

Authorization is **feature-based**, not role-based. Each user row has a `features` text array in Postgres. Every protected action maps to a feature string.

## Available features

```
User:     create:user, read:user, read:user:self, update:user, update:user:others
Session:  create:session, read:session
Tokens:   read:activation_token, create:password_reset_token, read:password_reset_token
Infra:    read:migration, create:migration, read:status, read:status:all
```

## Anonymous users

Anonymous requests (no session cookie) receive a virtual user object with:

```js
features: [
  "read:activation_token",
  "create:session",
  "create:user",
  "create:password_reset_token",
  "read:password_reset_token",
];
```

This means registration, login, and password reset are always public.

## Enforcing access on a route

```js
controller.canRequest("update:user");
```

Used as middleware in next-connect chains. Throws `ForbiddenError` if the feature is missing.

## Resource-level check for update:user

`update:user` has special logic: a user can always update themselves (`user.id === resource.id`). To update others, they need `update:user:others`.

## Filtering output

```js
authorization.filterOutput(user, "read:user:self", resource);
```

Returns only the fields the caller is allowed to see. `read:user` exposes public fields; `read:user:self` additionally exposes `email` (only when `user.id === resource.id`).

## Related pages

- [[auth-flow]]
- [[error-handling]]
- [[session]]
