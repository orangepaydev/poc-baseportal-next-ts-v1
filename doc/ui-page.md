# UI Page Reference

This document defines the reference implementation for generating CRUD UI pages for a database resource. The User Group pages serve as the canonical examples.

## Prompt Usage

To generate UI pages for a new database resource, prompt the agent with:

> Create UI pages for the `{ResourceName}` resource.

The agent should ask:

1. **Can the resource be Created, Edited, or Deleted?**
   - **Yes** → Generate all pages: Query, View, Create, Edit, and Delete.
   - **No** → Generate only the Query and View pages.
2. **Which users should have access to this UI?**
   - Read `docker-init/mariadb/init/003-owner.sql` to list the seeded user groups and their memberships:
     - `OwnerAdmin` — `root1`, `root2` (Admin users)
     - `OwnerUser` — `user1`, `user2` (Standard users)
     - `UserGroupMaker` — `root1`
     - `UserGroupChecker` — `root1`, `root2`
   - Present these groups to the user and ask which ones should see the new menu item.
   - The **OwnerAdmin** group should always have access by default since it is the administrative group.

## Reference Implementations

Each page type maps to a User Group reference page:

| Page Type | Description | Reference Implementation |
|-----------|-------------|--------------------------|
| **Query** | Search and list records with pagination | `src/app/(workspace)/admin/user-group/page.tsx` |
| **View** | Display a single record's details | `src/app/(workspace)/admin/user-group/[groupId]/page.tsx` |
| **Edit** | Form to update an existing record | `src/app/(workspace)/admin/user-group/[groupId]/edit/page.tsx` |
| **Create** | Form to add a new record | `src/app/(workspace)/admin/user-group/new/page.tsx` |
| **Delete** | Confirmation modal to delete a record | `src/app/(workspace)/admin/user-group/[groupId]/delete-user-group-request-button.tsx` |

Supporting files:

| File | Description | Reference Implementation |
|------|-------------|--------------------------|
| **Server Actions** | Form submissions, error handling, redirects | `src/app/(workspace)/admin/user-group/actions.ts` |

## Panel Types

### Detail Panel

Displays the details for a single database record or a SQL query that returns a single row.

Use on: **View** pages and **Edit** pages (to show current values).

Reference: The User Group Detail page (`src/app/(workspace)/admin/user-group/[groupId]/page.tsx`) renders a key-value table with fields like ID, code, status, member count, permission count, updated date, and description.

### Query Panel

Displays a table listing multiple database records or SQL query results with many rows.

Use on: **Query** pages.

Reference: The User Group Search page (`src/app/(workspace)/admin/user-group/page.tsx`) renders a search form, a results table with columns, pagination, and row-level status indicators.

## Menu Item and Permission Seeding

When generating UI pages for a new resource, also generate the SQL and navigation entries required to make the new pages accessible.

### 1. Add a navigation item to `src/lib/navigation.ts`

Register the new resource in the appropriate navigation group. Follow the existing pattern:

```ts
{
  title: '{Resource Title}',
  slug: '{resource-slug}',
  description: '...',
  href: '/admin/{resource-slug}',
  access: {
    menuPermissionCode: 'MENU_ADMIN_{RESOURCE_CODE}',
    requiredPermissionCodes: ['{RESOURCE_CODE}_READ'],
  },
}
```

Reference: the User Group entry in `src/lib/navigation.ts`.

### 2. Add permission rows to `docker-init/mariadb/init/002-authz-approval-schema.sql`

Insert a `MENU_ITEM` permission for the new menu and, if the resource supports CRUD operations, insert `READ`, `WRITE`, and `APPROVE` permissions. Follow the existing seed pattern:

```sql
UNION ALL SELECT 'MENU_ADMIN_{RESOURCE_CODE}', 'MENU_ITEM', 'MENU', 'admin/{resource-slug}', 'Access Admin {Resource Title}', 'Shows the Admin {Resource Title} menu item.'
UNION ALL SELECT '{RESOURCE_CODE}_READ', '{RESOURCE_CODE}', 'READ', '*', 'Read {Resource Title}', 'Allows viewing {resource} records.'
UNION ALL SELECT '{RESOURCE_CODE}_WRITE', '{RESOURCE_CODE}', 'WRITE', '*', 'Maintain {Resource Title}', 'Allows requesting {resource} changes.'
UNION ALL SELECT '{RESOURCE_CODE}_APPROVE', '{RESOURCE_CODE}', 'APPROVE', '*', 'Approve {Resource Title} Changes', 'Allows approving {resource} changes.'
```

If the resource type does not already exist in `permission_resource_types`, add a row for it as well.

### 3. Assign permissions to user groups in `docker-init/mariadb/init/003-owner.sql`

Grant the new menu and data permissions to the user groups selected by the user. The **OwnerAdmin** group always receives the menu and `READ` permissions by default.

Follow the existing seed pattern in `003-owner.sql`:

```sql
UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_{RESOURCE_CODE}'
UNION ALL SELECT 'OwnerAdmin', '{RESOURCE_CODE}_READ'
```

If the user selects additional groups, add rows for those groups as well. If the resource supports Create/Edit/Delete, consider creating dedicated Maker and Checker groups following the `UserGroupMaker` / `UserGroupChecker` pattern.

## Route Structure Convention

Follow the User Group route structure when creating pages for a new resource:

```
/admin/{resource}/                    → Query page (search + list)
/admin/{resource}/new                 → Create page
/admin/{resource}/[{resourceId}]      → View page (detail)
/admin/{resource}/[{resourceId}]/edit → Edit page
```

The Delete action uses a client component with a confirmation modal embedded in the View page, not a separate route.

## Page Patterns

Every generated page should follow these conventions from the User Group reference:

1. **Permission check first** — call `requireNavigationItemAccess()` before loading data.
2. **Pending request blocking** — disable Create, Edit, and Delete when a pending approval request exists for the resource.
3. **Two-step submission** — forms submit to server actions that call library functions, then redirect.
4. **Query param messaging** — pass success notices and errors as search params after redirect.
5. **Back button** — View pages link back to Query; Edit, Create, and Approve pages link back to View or Query.
6. **Conditional UI** — show or hide action buttons based on the user's permission codes and the resource state.
