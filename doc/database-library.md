# Database Library

## Purpose

This project now includes a server-side database library under `src/lib/db`.

The library provides one generic query interface for multiple database engines so application code does not need to know whether a connection uses MariaDB or PostgreSQL.

## Supported Engines

- `mariadb`
- `postgresql`

## Connection Model

The library supports one default connection and optional named connections.

- Use `DB_CONNECTION_NAMES` to declare the configured connection names.
- Use `DB_DEFAULT_CONNECTION` to choose which declared connection is the default.
- Each connection is configured with environment variables using the pattern `DB_<CONNECTION_NAME>_*`.
- The default connection also supports `DB_DEFAULT_*` variables.

Example names:

- `default`
- `reporting`
- `audit`

## Placeholder Rules

Application code should always use `?` placeholders regardless of the underlying engine.

Examples:

```ts
await db.query('select * from users where organization_id = ? and status = ?', [
  organizationId,
  'ACTIVE',
]);
```

For PostgreSQL, the library converts `?` placeholders into `$1`, `$2`, and so on before executing the statement.

## Query API

The main entry point is `src/lib/db/index.ts`.

- `db.query<T>(sql, params?, options?)`
  - returns zero or more rows
- `db.queryOne<T>(sql, params?, options?)`
  - returns `null` when no row exists
  - throws if more than one row is returned
- `db.execute(sql, params?, options?)`
  - runs a write-oriented statement and returns metadata such as affected rows

`options.connectionName` can be used to target a named connection. If no connection name is supplied, the default connection is used.

## Scope

This library is intended for server-side use only.

- It imports `server-only`.
- Do not import it into client components.
