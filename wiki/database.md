# Database

**Summary**: PostgreSQL connection layer — how the pool is configured, how queries are executed, and how SSL is handled.

**Sources**: infra/database.js, .env.development, .env.example

**Last updated**: 2026-06-07

---

`infra/database.js` wraps `pg.Pool` and exposes three methods.

## API

```js
database.query(queryObject); // parameterized query via pool
database.getNewClient(); // dedicated client for transactions
database.end(); // close pool (used in tests)
```

All query errors are caught and re-thrown as `ServiceError` (503).

## Transactions

Use `getNewClient()` for multi-statement transactions. Pattern:

```js
const client = await database.getNewClient();
try {
  await client.query("BEGIN");
  // ...queries...
  await client.query("COMMIT");
} catch (error) {
  await client?.query("ROLLBACK");
  throw error;
} finally {
  await client?.release();
}
```

Used in [[password-reset]] to atomically update password + delete all sessions.

## SSL

- If `POSTGRES_CA` env var is set → uses it as the CA certificate
- In production (no CA) → `ssl: true`
- In development → `ssl: false`

## Environment variables

| Variable            | Purpose              |
| ------------------- | -------------------- |
| `POSTGRES_HOST`     | DB host              |
| `POSTGRES_PORT`     | DB port              |
| `POSTGRES_USER`     | DB user              |
| `POSTGRES_DB`       | DB name              |
| `POSTGRES_PASSWORD` | DB password          |
| `POSTGRES_CA`       | Optional SSL CA cert |

## Related pages

- [[migrations]]
- [[error-handling]]
- [[overview]]
