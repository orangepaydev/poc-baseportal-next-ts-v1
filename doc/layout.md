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
  - `Roles`
  - `Audit Log`

## Implementation Notes

- The workspace shell is handled by `src/components/workspace-shell.tsx` and wraps app routes from the root layout.
- The left menu supports two levels of collapsing:
  - the full sidebar can collapse from the top utility panel toggle
  - each folder section can expand or collapse independently
- Menu items are real links and route to placeholder pages under `src/app/[group]/[item]/page.tsx`.
- Navigation metadata is defined in `src/lib/navigation.ts` and reused by the shell and routed pages.
- The shell is responsive:
  - On larger screens the left panel fully hides when collapsed.
  - On smaller screens the panel is hidden when collapsed and shown as an overlay when opened.
- If future LLM tasks need to extend navigation, keep folder data centralized and reuse it for both the sidebar and page entry cards.
