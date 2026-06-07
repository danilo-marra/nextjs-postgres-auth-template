---
name: db-migrate
description: Scaffold a new node-pg-migrate migration file, help write the SQL, and run migrations:up. Use when adding/altering database tables.
disable-model-invocation: false
---

When the user invokes `/db-migrate` or asks to create a database migration:

1. Ask what schema change is needed (new table, new column, rename, index, etc.) if not already specified.

2. Run `npm run migrations:create` — this generates a timestamped file in `infra/migrations/`. Note the filename from the output.

3. Read the generated file. Write the `up` and `down` SQL using node-pg-migrate's query builder or raw SQL strings. Follow existing migration files in `infra/migrations/` for style.

4. Show the user the migration SQL before applying.

5. Run `npm run migrations:up` to apply. If it errors, show the error and fix before retrying.

6. Run `npm run migrations:status` to confirm the migration is applied.

Constraints:

- No ORM — raw parameterized SQL only
- Always write a `down` function that fully reverses the `up`
- Do not modify existing migration files — create a new one
