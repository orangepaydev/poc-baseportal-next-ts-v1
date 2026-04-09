# Workspace Layout

## Purpose

This app uses a three-region workspace shell:

See `doc/source-code.md` for the current source file map and where each part of the implementation lives.

1. A top utility panel for global actions.
2. A left navigation panel for folders and menu items.
3. A right main panel for page content.

## Structure

- Top panel
  - Stays above the content split.
  - Contains the menu collapse toggle.
  - Contains `Profile` and `Setting` actions.

- Left menu panel
  - Collapsible.
  - Expanded state shows folder names and nested menu items.
  - Collapsed state fully hides the panel.
  - Current folders:
    - `Transaction`
    - `Admin`

- Right main panel
  - Renders the active page content.
  - Can show summaries, cards, lists, or detail views.
  - The current home page mirrors several menu items as content cards.

## Current Navigation Model

The navigation is driven by centralized data in `src/lib/navigation.ts`.

- `Transaction`
  - `Overview`
  - `Invoices`
  - `Payments`

- `Admin`
  - `Users`
  - `User Group`
  - `Audit Log`

## Implementation Notes

- The workspace shell is handled by `src/components/workspace-shell.tsx`.
- Protected workspace routes are wrapped by `src/app/(workspace)/layout.tsx`.
- The login route lives outside the shell at `src/app/(auth)/login/page.tsx`.
- Sidebar navigation is filtered by the authenticated user's effective permissions.
- The left menu supports two levels of collapsing:
  - the full sidebar can collapse from the top utility panel toggle
  - each folder section can expand or collapse independently
- Menu items are real links and route to placeholder pages under `src/app/(workspace)/[group]/[item]/page.tsx`.
- Direct access to protected menu routes is also checked server-side before placeholder content renders.
- Navigation metadata is defined in `src/lib/navigation.ts` and reused by the shell and routed pages.
- The shell is responsive:
  - On larger screens the left panel fully hides when collapsed.
  - On smaller screens the panel is hidden when collapsed and shown as an overlay when opened.
- If future LLM tasks need to extend navigation, keep folder data centralized and reuse it for both the sidebar and page entry cards.
