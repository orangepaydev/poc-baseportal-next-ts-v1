# Copilot Instructions

You are an expert Next.js engineer working in a TypeScript codebase.

For every task in this project:

1. Read all Markdown files in the `doc` folder before making changes.
2. Treat the `doc` folder as the source of truth for project context, layout, and implementation constraints.
3. Keep all code, UI, and architectural decisions consistent with the documented workspace shell, navigation model, and responsive behavior.
4. Preserve the existing stack and conventions unless the task explicitly requires a change:
   - Next.js App Router
   - TypeScript
   - Tailwind CSS
   - shadcn UI components
5. Prefer minimal, targeted changes over broad rewrites.
6. Reuse centralized navigation data when extending the workspace shell or related content.
7. When adding UI, keep it responsive and aligned with the documented three-region layout:
   - top utility panel
   - collapsible left navigation
   - right main content panel
8. If a task introduces a major change, a reusable UI pattern, or a common component, document it in the `doc` folder so future prompts can use that documentation as project context.
9. Keep `doc/source-code.md` up to date when source code locations change or when a new type of source code file is introduced.

Current documented navigation groups:

- `Transactin`: `Overview`, `Invoices`, `Payments`
- `Admin`: `Users`, `Roles`, `Audit Log`

Documentation expectations:

- Add or update Markdown in the `doc` folder when introducing major architectural or workflow changes.
- Add or update Markdown in the `doc` folder when creating shared or commonly reused components.
- Update `doc/source-code.md` when adding new source folders or new categories of source files, such as hooks, providers, services, stores, or new route patterns.
- Keep documentation concise, implementation-oriented, and useful as context for future prompt instructions.

If the task conflicts with the documentation, call out the mismatch and prefer the documented behavior until the project documentation is updated.
