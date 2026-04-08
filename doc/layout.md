# Workspace Layout

## Purpose

This app uses a three-region workspace shell:

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
  - Collapsed state keeps the panel narrow and icon-first.
  - Current folders:
    - `Transactin`
    - `Admin`

- Right main panel
  - Renders the active page content.
  - Can show summaries, cards, lists, or detail views.
  - The current home page mirrors several menu items as content cards.

## Current Navigation Model

The navigation is currently driven by static data in the home page component.

- `Transactin`
  - `Overview`
  - `Invoices`
  - `Payments`

- `Admin`
  - `Users`
  - `Roles`
  - `Audit Log`

## Implementation Notes

- The collapsible behavior is handled client-side in the page component.
- The shell is responsive:
  - On larger screens the left panel shrinks when collapsed.
  - On smaller screens the panel is hidden when collapsed and shown as an overlay when opened.
- If future LLM tasks need to extend navigation, keep folder data centralized and reuse it for both the sidebar and the main content cards.