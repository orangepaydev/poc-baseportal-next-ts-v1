# Database Schema

## Purpose

This schema supports:

- multi-organization login
- group-based permissions
- maker-checker approval flows
- immutable audit trail records

The design separates live approved data from pending changes. Live tables contain only approved records. Pending changes are stored in approval tables until an approver accepts or rejects them.

## Design Summary

- `organizations` stores approved tenant records.
- `users` stores approved users for each organization.
- `user_groups` stores approved groups within each organization.
- `permissions` defines the permission catalog.
- `user_group_permissions` assigns permissions to groups.
- `user_group_memberships` assigns users to groups.
- `approval_requests` stores pending add, remove, update, and delete requests.
- `approval_locks` prevents more than one pending request for the same resource.
- `approval_request_actions` stores workflow steps such as submit, approve, reject, and cancel.
- `audit_events` stores an immutable system audit trail.

## Login Model

Login is tenant-aware and uses these fields:

- organization code
- username
- password

The `users` table enforces uniqueness on `(organization_id, username)`, which means the same username can exist in different organizations without collision.

Passwords are stored in `users.password_sha256` as a 64-character SHA-256 hexadecimal digest. This matches the stated requirement that the password stored in the database is a SHA value.

## Table Reference

### organizations

Approved tenant records.

- `organization_code` is the login-facing tenant key.
- Only approved organizations should exist in this table.

### users

Approved user records.

- Belongs to one organization.
- Login key is `(organization_id, username)`.
- `password_sha256` stores the password digest.
- `status` supports active, locked, and disabled states.

### user_groups

Approved user group records.

- Belongs to one organization.
- Users receive permissions only through group membership.
- `group_code` is unique within an organization.

### permission_actions

Lookup for permission behavior:

- `MENU`
- `READ`
- `WRITE`
- `APPROVE`

### permission_resource_types

Lookup for secured resource categories such as:

- menu item
- organization
- user
- user group
- group permission
- group membership
- approval request
- audit log

### permissions

Permission catalog entries.

- A permission ties together a resource type and an action.
- `resource_instance_key` allows instance-specific permissions such as a single menu item.
- Example: `MENU_ADMIN_USERS` grants visibility to the Admin Users menu.

### user_group_permissions

Approved many-to-many assignment between user groups and permissions.

- This table represents live effective access.
- New assignments should appear here only after approval.

### user_group_memberships

Approved many-to-many assignment between users and groups.

- This table represents live group membership.
- New assignments should appear here only after approval.

### approval_requests

One row per requested change.

Important fields:

- `resource_type`: the kind of resource being changed
- `resource_key`: the unique logical key of the resource
- `action_type`: `CREATE`, `UPDATE`, `DELETE`, `ADD`, or `REMOVE`
- `status`: pending or final workflow state
- `before_state`: JSON snapshot before the change
- `after_state`: JSON snapshot after the change
- `changed_fields`: optional JSON summary of the fields or relationship elements that changed
- `change_patch`: optional JSON instruction payload that the application can use to apply the approved change deterministically

This table allows the approver to see exactly what is changing before the live tables are modified.

Recommended usage:

- Treat `before_state` and `after_state` as the canonical review snapshots.
- Use `changed_fields` to avoid recalculating diffs in every review UI.
- Use `change_patch` for execution-oriented operations, especially `ADD` and `REMOVE` against join tables such as `user_group_permissions` and `user_group_memberships`.

### approval_locks

Resource-level lock table.

- Primary key is `(resource_type, resource_key)`.
- This enforces the rule that one resource can have only one pending change at a time.
- Create a lock row when a request is submitted.
- Delete the lock row when the request is approved, rejected, or cancelled.

### approval_request_actions

Workflow history for each approval request.

- Records submission, approval, rejection, and cancellation events.
- Useful for approval timelines and review comments.

### audit_events

Immutable audit trail.

- Stores who did what, when, and against which resource.
- Can be linked back to an approval request.
- Suitable for both business changes and workflow actions.

## Resource Keys

`approval_requests.resource_key` and `approval_locks.resource_key` should use stable logical identifiers, not only numeric IDs. That allows locking even before a row exists in a live table.

Recommended examples:

- organization: `ORG:{organization_code}`
- user: `ORG:{organization_code}:USER:{username}`
- user group: `ORG:{organization_code}:GROUP:{group_code}`
- group permission: `GROUP:{group_id}:PERMISSION:{permission_code}`
- group membership: `GROUP:{group_id}:USER:{user_id}`

## Approval Flow

### Create Organization

1. Insert a pending row into `approval_requests` with `action_type = 'CREATE'`.
2. Insert a row into `approval_locks` for `ORG:{organization_code}`.
3. On approval, insert into `organizations`.
4. Write workflow and audit entries.
5. Remove the lock.

### Create User

1. Insert a pending row into `approval_requests` with the proposed user payload in `after_state`.
2. Lock `ORG:{organization_code}:USER:{username}`.
3. On approval, insert into `users`.
4. Write workflow and audit entries.
5. Remove the lock.

### Add Permission to Group

1. Insert a pending approval request for the target group and permission.
2. Store the proposed relationship in `after_state`, a review-friendly summary in `changed_fields`, and an executable insert payload in `change_patch`.
3. Lock `GROUP:{group_id}:PERMISSION:{permission_code}`.
4. On approval, execute the intended insert into `user_group_permissions`.
5. Write workflow and audit entries.
6. Remove the lock.

### Add User to Group

1. Insert a pending approval request for the target group and user.
2. Store the proposed relationship in `after_state`, a review-friendly summary in `changed_fields`, and an executable insert payload in `change_patch`.
3. Lock `GROUP:{group_id}:USER:{user_id}`.
4. On approval, execute the intended insert into `user_group_memberships`.
5. Write workflow and audit entries.
6. Remove the lock.

## Suggested Query Shapes For UI

The follow-up UI can build on these patterns:

- login lookup by organization code and username
- user effective permissions by joining `user_group_memberships`, `user_group_permissions`, and `permissions`
- approval inbox filtered by `approval_requests.status = 'PENDING'`
- approval detail view using `before_state`, `after_state`, `changed_fields`, `change_patch`, and `approval_request_actions`
- audit log view filtered by organization, actor, resource type, date range, and approval request

## Seed Data Included In SQL

The schema SQL also seeds:

- permission actions
- secured resource types
- permission entries for the current menu items
- baseline read, write, and approve permissions for organizations, users, groups, group permissions, group memberships, approvals, and audit log

## Implementation Notes

- The schema is written for MariaDB.
- The SQL bootstrap file lives in `docker-init/mariadb/init` so it runs automatically on first startup of an empty database volume.
- The application should treat live tables as approved state and approval tables as pending workflow state.
- `changed_fields` is intended for review-time display and should be generated when the request is created.
- `change_patch` is intended for approval-time execution and is especially useful for relationship tables where the business change is an add or remove operation rather than a traditional row update.