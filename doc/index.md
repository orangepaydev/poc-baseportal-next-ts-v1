# Documentation Index

## Purpose

This file is the entry point for documentation lookup.

Agents should read this file first, identify which documents are relevant to the current task, and then open only those specific files unless the task explicitly requires a broader documentation review.

## Document Map

### `authentication.md`

Read when the task involves:

- login
- session cookies
- password reset or change-password flow
- protected routes
- permission-aware shell behavior

### `change-review.md`

Read when the task involves:

- approval request payloads
- `before_state`, `after_state`, `changed_fields`, or `change_patch`
- review UI rendering for pending changes
- deterministic approval execution payloads

### `database-library.md`

Read when the task involves:

- `src/lib/db`
- MariaDB or PostgreSQL query helpers
- query limits
- placeholder behavior
- server-side database access patterns

### `layout.md`

Read when the task involves:

- workspace shell layout
- top bar, left navigation, or main content panel
- responsive shell behavior
- navigation structure or workspace UX

### `local-database.md`

Read when the task involves:

- Docker Compose services
- local MariaDB setup
- local SMTP setup
- local infrastructure startup or reset

### `permission-audit-approving.md`

Read when the task involves:

- authorization rules
- maker-checker workflow
- approval policies
- audit requirements
- permission modeling

### `schema.md`

Read when the task involves:

- database schema design
- table structure
- approval lock behavior
- resource keys
- seeded data model assumptions

### `services.md`

Read when the task involves:

- external or infrastructure-facing services
- SMTP or email helpers
- service configuration through environment variables
- adding a new shared service module

### `source-code.md`

Read when the task involves:

- locating source files
- understanding where responsibilities live
- deciding where new files should be added
- updating the source map after structural changes

### `ui-page.md`

Read when the task involves:

- generating Query, View, Edit, Create, or Delete pages
- admin CRUD route conventions
- permission-gated menu items
- organization-scoped UI page patterns

## Selection Guidance

- Read `source-code.md` when the right implementation location is unclear.
- Read `layout.md` in addition to page-specific docs for shell or navigation changes.
- Read `schema.md` together with `permission-audit-approving.md` or `change-review.md` for approval workflow work.
- Read `ui-page.md` for new admin resource pages even if other documents also apply.
- If a task updates documentation behavior, update this index as part of the change.