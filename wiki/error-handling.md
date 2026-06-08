# Error Handling

**Summary**: Typed error hierarchy and how errors flow from models through the controller to API responses.

**Sources**: infra/errors.ts, infra/controller.ts

**Last updated**: 2026-06-08

---

All errors extend `Error` and implement `toJSON()` to produce a consistent JSON response shape:

```json
{
  "name": "ErrorClassName",
  "message": "Human-readable description.",
  "action": "What the caller should do.",
  "status_code": 400
}
```

## Error classes

| Class                   | Status | When to throw                      |
| ----------------------- | ------ | ---------------------------------- |
| `ValidationError`       | 400    | Invalid input data                 |
| `UnauthorizedError`     | 401    | No valid session                   |
| `ForbiddenError`        | 403    | Session exists but feature missing |
| `NotFoundError`         | 404    | Resource not found in DB           |
| `MethodNotAllowedError` | 405    | HTTP method not accepted by route  |
| `ServiceError`          | 503    | DB connection/query failure        |
| `InternalServerError`   | 500    | Unexpected error (wraps cause)     |

## Controller error handling

`onErrorHandler` in `infra/controller.ts`:

- `ValidationError`, `NotFoundError`, `ForbiddenError` → returned directly as JSON
- `UnauthorizedError` → cookie cleared + returned as JSON
- Everything else → wrapped in `InternalServerError`, logged with `console.error`, returned as 500

`onNoMatchHandler` returns a `MethodNotAllowedError` for undefined HTTP methods.

## Usage rule

Never throw plain `Error` objects. Always use the typed classes from `infra/errors.ts`.

## Related pages

- [[rbac]]
- [[database]]
- [[api-routes]]
