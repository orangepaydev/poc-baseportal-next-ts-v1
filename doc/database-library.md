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

## Connection Pooling

The library uses connection pooling for supported database engines.

- MariaDB connections are created through the `mariadb` driver's pool.
- PostgreSQL connections are created through the `pg` driver's pool.
- Pools are owned by the shared `DatabaseManager` and are reused across calls in both development and production.

Supported pool-related settings:

- `DB_<CONNECTION_NAME>_CONNECTION_LIMIT`
- `DB_<CONNECTION_NAME>_IDLE_TIMEOUT_MS`
- `DB_<CONNECTION_NAME>_CONNECTION_TIMEOUT_MS`

For the default connection, the same settings can also be supplied with `DB_DEFAULT_*` names.

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

## Query Result Limit

- `DB_QUERY_RESULT_LIMIT` sets the default maximum number of rows returned by `db.query()` when the SQL does not already include its own `LIMIT` clause.
- If the value is omitted, the library defaults to `1000` rows.
- The library applies a hard ceiling of `10000` rows even if the configured value is higher.

## Query API

The main entry point is `src/lib/db/index.ts`.

- `db.query<T>(sql, params?, options?)`
  - returns zero or more rows
  - when the SQL does not already include `LIMIT`, the library appends one using `DB_QUERY_RESULT_LIMIT`
- `db.queryOne<T>(sql, params?, options?)`
  - returns `null` when no row exists
  - throws if more than one row is returned
  - internally limits the read to two rows so it can still detect duplicate matches efficiently
- `db.execute(sql, params?, options?)`
  - runs a write-oriented statement and returns metadata such as affected rows

`options.connectionName` can be used to target a named connection. If no connection name is supplied, the default connection is used.

## Imports

Import the library from `@/lib/db` in server-side Next.js files.

Common imports:

```ts
import { db } from '@/lib/db';
```

If you prefer named helpers instead of the `db` object:

```ts
import { execute, query, queryOne } from '@/lib/db';
```

## Next.js Usage

This project uses the App Router, so the database library is intended for:

- server components
- route handlers
- server actions
- other server-only modules

Do not import it into client components.

### Example: Server Component Page

Use the library directly inside an async page component.

```ts
import { db } from '@/lib/db';

type OrganizationRow = {
  id: number;
  organization_code: string;
  organization_name: string;
  status: 'ACTIVE' | 'INACTIVE';
};

export default async function OrganizationsPage() {
  const organizations = await db.query<OrganizationRow>(
    `
      select
        id,
        organization_code,
        organization_name,
        status
      from organizations
      order by organization_name
    `
  );

  return (
    <div>
      <h1>Organizations</h1>
      <ul>
        {organizations.map((organization) => (
          <li key={organization.id}>
            {organization.organization_name} ({organization.organization_code})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example: Dynamic App Router Page

Use `queryOne` when the page expects at most one record.

```ts
import { notFound } from 'next/navigation';

import { db } from '@/lib/db';

type UserRow = {
  id: number;
  username: string;
  display_name: string;
  status: 'ACTIVE' | 'LOCKED' | 'DISABLED';
};

type UserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserPage({ params }: UserPageProps) {
  const { userId } = await params;

  const user = await db.queryOne<UserRow>(
    `
      select
        id,
        username,
        display_name,
        status
      from users
      where id = ?
    `,
    [Number(userId)]
  );

  if (!user) {
    notFound();
  }

  return (
    <div>
      <h1>{user.display_name}</h1>
      <p>{user.username}</p>
      <p>{user.status}</p>
    </div>
  );
}
```

### Example: Route Handler

Use route handlers when you need an API-style endpoint.

```ts
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

type GroupRow = {
  id: number;
  group_code: string;
  group_name: string;
};

export async function GET() {
  const groups = await db.query<GroupRow>(
    `
      select
        id,
        group_code,
        group_name
      from user_groups
      order by group_name
    `
  );

  return NextResponse.json({ data: groups });
}
```

### Example: Write Query

Use `execute` for inserts, updates, and deletes.

```ts
import { execute } from '@/lib/db';

await execute(
  `
    update users
    set status = ?
    where id = ?
  `,
  ['LOCKED', 42]
);
```

### Example: Named Connection

If a query should use a non-default connection, pass `connectionName` in the options object.

```ts
import { db } from '@/lib/db';

const auditRows = await db.query(
  'select * from audit_events order by occurred_at desc limit 20',
  [],
  {
    connectionName: 'reporting',
  }
);
```

## Recommended Pattern

For page code, keep SQL close to the server component until the query logic becomes shared or complex.

When multiple pages need the same database logic, move that logic into a server-only module such as `src/lib/` and have the page import that helper.

## Scope

This library is intended for server-side use only.

- It imports `server-only`.
- Do not import it into client components.
