# Source Code Map

## Purpose

This document describes where the application source code lives and what each current source file is responsible for.

## Top-Level Rule

- Application source code lives under `src/`.
- Documentation lives under `doc/`.
- Project configuration files live at the repository root.

## Source Tree

### `src/app/`

App Router entry points, route files, and global styling.

- `src/app/layout.tsx`
  - Root layout for the app.
  - Imports global CSS.
  - Wraps all routed content with the shared workspace shell.

- `src/app/page.tsx`
  - Home page.
  - Renders overview cards for the documented navigation groups and links into route pages.

- `src/app/[group]/[item]/page.tsx`
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
  - Reads navigation metadata from `src/lib/navigation.ts`.

### `src/components/ui/`

Shared UI primitives.

- `src/components/ui/button.tsx`
  - Reusable button primitive based on shadcn UI conventions.
  - Used by the workspace shell and page entry actions.

### `src/lib/`

Shared non-visual utilities and application metadata.

- `src/lib/navigation.ts`
  - Central source of truth for navigation groups and menu items.
  - Exposes route metadata used by the sidebar, home page, and dynamic item pages.

- `src/lib/utils.ts`
  - Shared utility helpers.
  - Currently provides the `cn` class name merge helper.

## How To Maintain This File

- Update this file when new source folders are added under `src/`.
- Update this file when a new type of source file is introduced, such as a new route pattern, provider, hook, service, store, or shared UI area.
- Keep descriptions implementation-oriented and brief.
- If a file is moved or deleted, update this map so it stays accurate.
