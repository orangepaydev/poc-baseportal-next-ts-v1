# Source Code Map

## Purpose

This document describes where the application source code lives and what each current source file is responsible for.

## Top-Level Rule

- Application source code lives under `src/`.
- Documentation lives under `doc/`.
- Project configuration files live at the repository root.
- Local development infrastructure files may also live at the repository root or under dedicated setup folders.

## Local Infrastructure

### `docker-compose.yml`

Local Docker Compose entry point for infrastructure services.

- `.env`
  - Local environment values for the app's default database connection.

- `docker-compose.yml`
  - Starts a local MariaDB instance for development.
  - Uses fixed local-development MariaDB container settings.
  - Mounts database initialization scripts from `docker-init/mariadb/init`.

- `dev-resource-start.sh`
  - Starts the local Docker Compose development resources in detached mode.

- `dev-resource-shutdown.sh`
  - Stops the local Docker Compose development resources.
  - Removes the Compose-managed volumes so MariaDB can be reinitialized cleanly.

### `docker-init/mariadb/init/`

MariaDB bootstrap assets used by the Docker container on first startup.

- `docker-init/mariadb/init/001-create-portaldb.sql`
  - Ensures the local development database exists with the expected character set and collation.
  - Creates the local development database user `dbuser` with password `dbpass123` and grants full access to `portaldb`.

- `docker-init/mariadb/init/002-authz-approval-schema.sql`
  - Creates the MariaDB schema for tenant-aware login, group permissions, approval workflow, and audit trail.
  - Seeds baseline permission metadata for the current workspace navigation and admin resources.

- `docker-init/mariadb/init/003-owner.sql`
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

- `src/lib/navigation.ts`
  - Central source of truth for navigation groups and menu items.
  - Exposes route metadata and permission requirements used by the sidebar, home page, and dynamic item pages.

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
