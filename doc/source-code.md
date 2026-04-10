# Source Code Map

## Purpose

This document describes where the application source code lives and what each current source file is responsible for.

## Top-Level Rule

- Application source code lives under `src/`.
- Documentation lives under `doc/`.
- Project configuration files live at the repository root.
- Local development infrastructure files may also live at the repository root or under dedicated setup folders.
- Admin Query and View data access should be scoped by the authenticated session `organizationId` by default unless a page is explicitly intended to span multiple organizations.

## Documentation Set

- `doc/ui-page.md`
  - Reference guide for generating CRUD UI pages from the User Group examples.
  - States that Query and View data access should include the authenticated session `organizationId` by default unless the user explicitly asks for cross-organization behavior.

- `doc/services.md`
  - Shared reference for infrastructure-facing service modules such as email and future integrations like LDAP, PKI, or crypto.
  - Documents service purpose, configuration, usage patterns, and extension guidance for future agents.

## Local Infrastructure

### `docker-compose.yml`

Local Docker Compose entry point for infrastructure services.

- `.env`
  - Local environment values for the app's default database connection.

- `.env.example`
  - Checked-in template for the local database, session, and SMTP settings.

- `docker-compose.yml`
  - Starts a local MariaDB instance for development.
  - Starts a local SMTP test service with a browser inbox.
  - Uses fixed local-development MariaDB container settings.
  - Mounts database initialization scripts from `docker-init/mariadb/init`.

- `dev-resource-start.sh`
  - Starts the local Docker Compose development resources in detached mode.

- `dev-resource-shutdown.sh`
  - Stops the local Docker Compose development resources.
  - Removes the Compose-managed volumes so MariaDB can be reinitialized cleanly.

### `docker-init/mariadb/init/`

MariaDB bootstrap assets used by the Docker container on first startup.

- `docker-init/mariadb/init/001-portaldb-create.sql`
  - Ensures the local development database exists with the expected character set and collation.
  - Creates the local development database user `dbuser` with password `dbpass123` and grants full access to `portaldb`.

- `docker-init/mariadb/init/002-portaldb-schema.sql`
  - Creates the MariaDB schema for tenant-aware login, reusable system-code lookup tables, group permissions, approval workflow, and audit trail.
  - Seeds baseline permission metadata for the current workspace navigation and admin resources.

- `docker-init/mariadb/init/003-portaldb-records.sql`
  - Seeds the initial `owner` tenant, users, user groups, memberships, and menu permission assignments.

## Source Tree

### `src/app/`

App Router entry points, route files, and global styling.

- `src/app/layout.tsx`
  - Root layout for the app.
  - Imports global CSS.
  - Provides the shared HTML and body wrapper for all route groups.

- `src/app/(auth)/login/page.tsx`
  - Login page rendered outside the workspace shell.
  - Submits tenant-aware credentials for organization, user, and password.

- `src/app/(workspace)/layout.tsx`
  - Protected workspace layout.
  - Requires a valid session cookie before rendering the shared workspace shell.

- `src/app/(workspace)/page.tsx`
  - Protected home page.
  - Renders overview cards for the documented navigation groups and links into route pages.
  - Shows the authenticated organization and user context.

- `src/app/(workspace)/admin/user-group/page.tsx`
  - Dedicated Admin User Group search page.
  - Renders the query panel and the query result panel for organisation-scoped user groups.

- `src/app/(workspace)/admin/user-group/new/page.tsx`
  - Create-request page for new user groups.
  - Submits maker requests instead of inserting directly into the live table.

- `src/app/(workspace)/admin/user-group/[groupId]/page.tsx`
  - User group detail page.
  - Shows top-level actions based on pending-request state and current permissions.

- `src/app/(workspace)/admin/user-group/[groupId]/edit/page.tsx`
  - User group edit page.
  - Allows editing the user group name only for the current version of the workflow.

- `src/app/(workspace)/admin/user-group-permission/page.tsx`
  - Admin User Group Permission search page.
  - Renders the query panel and the query result panel for organisation-scoped user groups whose permissions can be reviewed.

- `src/app/(workspace)/admin/user-group-permission/[groupId]/page.tsx`
  - User Group Permission detail page.
  - Shows user group detail data together with the currently assigned permissions for that group.

- `src/app/(workspace)/admin/user-group-permission/[groupId]/edit/page.tsx`
  - User Group Permission edit page.
  - Allows submitting maker-checker requests to add or remove permissions from a user group.

- `src/app/(workspace)/admin/user-group-permission/[groupId]/user-group-permission-editor.tsx`
  - Route-local client component for the permission selection table and search modal used by the edit page.

- `src/app/(workspace)/admin/user-group-permission/actions.ts`
  - Server actions for the Admin User Group Permission pages.
  - Submits user group permission change requests and supports route-aware redirects.

- `src/app/(workspace)/admin/user-group-membership/page.tsx`
  - Admin User Group Membership search page.
  - Renders the query panel and query result panel for organisation-scoped user groups whose memberships can be reviewed.

- `src/app/(workspace)/admin/user-group-membership/[groupId]/page.tsx`
  - User Group Membership detail page.
  - Shows user group detail data together with the currently assigned users for that group.

- `src/app/(workspace)/admin/user-group-membership/[groupId]/edit/page.tsx`
  - User Group Membership edit page.
  - Allows submitting maker-checker requests to add or remove users from a user group.

- `src/app/(workspace)/admin/user-group-membership/[groupId]/user-group-membership-editor.tsx`
  - Route-local client component for the user selection table and search modal used by the edit page.

- `src/app/(workspace)/admin/user-group-membership/actions.ts`
  - Server actions for the Admin User Group Membership pages.
  - Submits user group membership change requests and supports route-aware redirects.

- `src/app/(workspace)/admin/user-group/[groupId]/delete-user-group-request-button.tsx`
  - Route-local client component for the delete confirmation modal.
  - Submits a delete maker request from the detail page.

- `src/app/(workspace)/admin/user-group/actions.ts`
  - Server actions for the Admin User Group page.
  - Submits user group change requests and processes approval decisions.
  - Supports route-aware redirects for the list, detail, edit, and create pages.

- `src/app/(workspace)/admin/users/page.tsx`
  - Admin Users search page.
  - Renders the query panel and the query result panel for organisation-scoped users.

- `src/app/(workspace)/admin/users/new/page.tsx`
  - Create-request page for new users.
  - Submits maker requests instead of inserting directly into the live table.

- `src/app/(workspace)/admin/users/[userId]/page.tsx`
  - User detail page.
  - Shows top-level actions based on pending-request state and current permissions.

- `src/app/(workspace)/admin/users/[userId]/edit/page.tsx`
  - User edit page.
  - Allows editing display name, email, user type, and status.

- `src/app/(workspace)/admin/users/[userId]/delete-user-request-button.tsx`
  - Route-local client component for the delete confirmation modal.
  - Submits a delete maker request from the detail page.

- `src/app/(workspace)/admin/users/actions.ts`
  - Server actions for the Admin Users page.
  - Submits user change requests and processes approval decisions.
  - Supports route-aware redirects for the list, detail, edit, and create pages.

- `src/app/(workspace)/admin/organization/page.tsx`
  - Admin Organizations search page.
  - Renders the query panel and the query result panel for organizations.

- `src/app/(workspace)/admin/organization/new/page.tsx`
  - Create-request page for new organizations.
  - Submits maker requests instead of inserting directly into the live table.

- `src/app/(workspace)/admin/organization/[organizationId]/page.tsx`
  - Organization detail page.
  - Shows top-level actions based on pending-request state and current permissions.

- `src/app/(workspace)/admin/organization/[organizationId]/edit/page.tsx`
  - Organization edit page.
  - Allows editing organization name and status.

- `src/app/(workspace)/admin/organization/[organizationId]/delete-organization-request-button.tsx`
  - Route-local client component for the delete confirmation modal.
  - Submits a delete maker request from the detail page.

- `src/app/(workspace)/admin/organization/actions.ts`
  - Server actions for the Admin Organization page.
  - Submits organization change requests and processes approval decisions.
  - Supports route-aware redirects for the list, detail, edit, and create pages.

- `src/app/(workspace)/admin/system-code/page.tsx`
  - Admin System Code search page.
  - Renders the query panel and the query result panel for global System Codes.

- `src/app/(workspace)/admin/system-property/page.tsx`
  - Admin System Property search page.
  - Renders the query panel and query result panel for owner-only System Properties.

- `src/app/(workspace)/admin/system-property/new/page.tsx`
  - Create-request page for new System Properties.
  - Submits maker requests instead of inserting directly into the approved live table.

- `src/app/(workspace)/admin/system-property/[propertyId]/page.tsx`
  - System Property detail page.
  - Shows the property header and a listing panel for approved System Property Values.

- `src/app/(workspace)/admin/system-property/[propertyId]/value/new/page.tsx`
  - Create-request page for new System Property Values under an approved System Property.

- `src/app/(workspace)/admin/system-property/[propertyId]/value/[valueId]/edit/page.tsx`
  - System Property Value edit page.
  - Allows edit and delete maker requests for an individual System Property Value.

- `src/app/(workspace)/admin/system-property/[propertyId]/value/[valueId]/delete-system-property-value-request-button.tsx`
  - Route-local client component for the System Property Value delete confirmation modal.

- `src/app/(workspace)/admin/system-property/actions.ts`
  - Server actions for the Admin System Property pages.
  - Submits System Property and System Property Value change requests and supports route-aware redirects.

- `src/app/(workspace)/admin/system-code/new/page.tsx`
  - Create-request page for new System Codes.
  - Submits maker requests instead of inserting directly into the approved live state.

- `src/app/(workspace)/admin/system-code/[systemCodeId]/page.tsx`
  - System Code detail page.
  - Shows top-level actions and a listing panel for the current System Code Values.

- `src/app/(workspace)/admin/system-code/[systemCodeId]/edit/page.tsx`
  - System Code edit page.
  - Allows editing the System Code header and submitting System Code Value add or remove changes through maker-checker.

- `src/app/(workspace)/admin/system-code/[systemCodeId]/system-code-values-editor.tsx`
  - Route-local client component for adding new System Code Value rows and marking existing values for removal.

- `src/app/(workspace)/admin/system-code/actions.ts`
  - Server actions for the Admin System Code pages.
  - Submits System Code create and update requests and supports route-aware redirects.

- `src/lib/system-properties.ts`
  - Owner-only System Property query and maker-checker library.
  - Loads approved System Properties and submits create, add, update, and delete approval requests for System Property Values.

- `src/lib/user-group-permissions.ts`
  - Organisation-scoped user group permission query and maker-checker library.
  - Loads approved permission assignments for a user group and submits add or remove permission requests for review.

- `src/lib/user-group-memberships.ts`
  - Organisation-scoped user group membership query and maker-checker library.
  - Loads approved user assignments for a user group and submits add or remove membership requests for review.

- `src/lib/change-interpreters/system-property.ts`
  - Approval-request change interpreter for System Property and System Property Value requests.

- `src/lib/change-interpreters/group-permission.ts`
  - Approval-request change interpreter for user group permission assignment requests.

- `src/lib/change-interpreters/group-membership.ts`
  - Approval-request change interpreter for user group membership assignment requests.

- `src/app/(workspace)/admin/audit-log/page.tsx`
  - Audit Log search page.
  - Renders the query panel with event type and resource type filters and paginated results.

- `src/app/(workspace)/admin/audit-log/[eventId]/page.tsx`
  - Audit Event detail page.
  - Shows event metadata, actor context, linked approval request, and event data payload.

- `src/app/(workspace)/admin/approval-request/page.tsx`
  - Approval Request search page.
  - Renders the query panel with status and resource type filters and paginated results.

- `src/app/(workspace)/admin/approval-request/[requestId]/page.tsx`
  - Approval Request detail page.
  - Shows request metadata, interpreted change details, and workflow history.

- `src/app/(workspace)/[group]/[item]/page.tsx`
  - Dynamic placeholder page for sidebar menu items.
  - Resolves route params against centralized navigation data.

- `src/app/globals.css`
  - Global styles and theme tokens.
  - Tailwind and shared design tokens are defined here.

### `src/components/`

Reusable React components used across routes.

- `src/components/workspace-shell.tsx`
  - Shared client-side workspace shell.
  - Owns the top panel, collapsible left navigation, and main content frame.
  - Renders only the navigation groups visible to the authenticated user.

### `src/components/ui/`

Shared UI primitives.

- `src/components/ui/button.tsx`
  - Reusable button primitive based on shadcn UI conventions.
  - Used by the workspace shell and page entry actions.

### `src/lib/`

Shared non-visual utilities and application metadata.

- `src/lib/auth/types.ts`
  - Shared authenticated-session type used by server modules and UI components.

- `src/lib/auth/session.ts`
  - Creates, verifies, reads, and clears the signed session cookie.
  - Exposes helpers for protected routes.

- `src/lib/auth/login.ts`
  - Verifies tenant-aware credentials against the `organizations` and `users` tables.
  - Produces the authenticated session payload after successful verification.
  - Updates `users.last_login_at` on successful login.

- `src/lib/auth/actions.ts`
  - Server actions for login and logout.
  - Sets or clears the signed session cookie and redirects accordingly.

- `src/lib/auth/audit.ts`
  - Writes login success and failure events into `audit_events`.
  - Captures request metadata such as IP address and user agent when available.

- `src/lib/auth/authorization.ts`
  - Loads the authenticated user's effective permission grants through group membership.
  - Derives menu visibility metadata for the shell and landing page.
  - Enforces route-level workspace menu access.
  - Also enforces session-scoped navigation rules such as Owner-organization-only admin pages.

- `src/lib/email.ts`
  - Server-only SMTP email helper.
  - Loads environment-based transport settings and sends outbound email through the configured server.

- `src/lib/organization-admin-account-email.ts`
  - Domain-specific email template and sender for organization-admin account provisioning.
  - Builds the welcome message content used when a newly approved organization gets its initial admin users.

- `src/lib/navigation.ts`
  - Central source of truth for navigation groups and menu items.
  - Exposes route metadata and permission requirements used by the sidebar, home page, and dynamic item pages.
  - Supports per-item access constraints beyond permission codes, including Owner-organization-only navigation entries.

- `src/lib/user-groups.ts`
  - Server-side user group workflow module.
  - Supports user group search, detail lookups, pending-request lookups, maker submissions, and checker decisions.

- `src/lib/users.ts`
  - Server-side user workflow module.
  - Supports user search, detail lookups, pending-request lookups, maker submissions, and checker decisions.

- `src/lib/organizations.ts`
  - Server-side organization workflow module.
  - Supports organization search, detail lookups, pending-request lookups, maker submissions, and checker decisions.

- `src/lib/system-codes.ts`
  - Server-side System Code workflow module.
  - Supports search, detail lookups with System Code Values, pending-request lookups, and maker submissions for create and update changes.

- `src/lib/audit-events.ts`
  - Server-side audit event query module.
  - Supports paginated search with event type and resource type filtering, and single-record detail lookups.

- `src/lib/approval-requests.ts`
  - Server-side approval request query module.
  - Supports paginated search with status and resource type filtering, and single-record detail lookups including workflow actions.

- `src/lib/change-interpreters/index.ts`
  - Registry that dispatches to resource-specific change interpreters.
  - Returns a structured interpreted change result or null for unknown resource types.

- `src/lib/change-interpreters/types.ts`
  - Shared types for change interpreters: `InterpretedChange`, `InterpretedFieldChange`, `ChangeInterpreter`.

- `src/lib/change-interpreters/user-group.ts`
  - Interprets `USER_GROUP` resource type changes from `changed_fields` or before/after state snapshots.

- `src/lib/change-interpreters/user.ts`
  - Interprets `USER` resource type changes from `changed_fields` or before/after state snapshots.

- `src/lib/change-interpreters/organization.ts`
  - Interprets `ORGANIZATION` resource type changes from `changed_fields` or before/after state snapshots.

- `src/lib/change-interpreters/system-code.ts`
  - Interprets `SYSTEM_CODE` resource type changes, including added and removed System Code Values.

- `src/lib/utils.ts`
  - Shared utility helpers.
  - Currently provides the `cn` class name merge helper.

### `src/lib/db/`

Server-side database access library.

- `src/lib/db/index.ts`
  - Public database entry point.
  - Exposes generic `query`, `queryOne`, and `execute` helpers.
  - Supports a default connection plus optional named connections.

- `src/lib/db/config.ts`
  - Reads and validates database configuration from environment variables.
  - Supports `mariadb` and `postgresql` connection types.

- `src/lib/db/types.ts`
  - Shared database types for connections, queries, and execution results.

- `src/lib/db/placeholders.ts`
  - Converts the library's generic `?` placeholder syntax into PostgreSQL positional placeholders.

- `src/lib/db/adapters/mariadb.ts`
  - MariaDB adapter implementation backed by the `mariadb` package.

- `src/lib/db/adapters/postgresql.ts`
  - PostgreSQL adapter implementation backed by the `pg` package.

## How To Maintain This File

- Update this file when new source folders are added under `src/`.
- Update this file when a new type of source file is introduced, such as a new route pattern, provider, hook, service, store, or shared UI area.
- Keep descriptions implementation-oriented and brief.
- If a file is moved or deleted, update this map so it stays accurate.
