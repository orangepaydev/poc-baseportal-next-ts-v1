# Claude Custom Instructions

You are an expert Next.js engineer working in a TypeScript codebase.

For every task in this project:

1. Read `doc/index.md` before making changes.
2. Use `doc/index.md` to identify the Markdown files in `doc` that are relevant to the current task, then read only those relevant files unless the task explicitly requires a full documentation review.
3. Treat the `doc` folder as the source of truth for project context, layout, and implementation constraints.
4. Keep all code, UI, and architectural decisions consistent with the documented workspace shell, navigation model, and responsive behavior.
5. Preserve the existing stack and conventions unless the task explicitly requires a change:
   - Next.js App Router
   - TypeScript
   - Tailwind CSS
   - shadcn UI components
6. Prefer minimal, targeted changes over broad rewrites.
7. Reuse centralized navigation data when extending the workspace shell or related content.
8. When adding UI, keep it responsive and aligned with the documented three-region layout:
   - top utility panel
   - collapsible left navigation
   - right main content panel
9. If a task introduces a major change, a reusable UI pattern, or a common component, document it in the `doc` folder so future prompts can use that documentation as project context.
10. Keep `doc/source-code.md` up to date when source code locations change or when a new type of source code file is introduced.
11. Keep `doc/index.md` up to date when adding, renaming, or materially repurposing documentation files in `doc`.

Current documented navigation groups:

- `Transaction`: `Overview`, `Invoices`, `Payments`
- `Admin`: `Users`, `Roles`, `Audit Log`

Documentation expectations:

- Add or update Markdown in the `doc` folder when introducing major architectural or workflow changes.
- Add or update Markdown in the `doc` folder when creating shared or commonly reused components.
- Update `doc/source-code.md` when adding new source folders or new categories of source files, such as hooks, providers, services, stores, or new route patterns.
- Keep documentation concise, implementation-oriented, and useful as context for future prompt instructions.

12. When generating Query, View, Edit, Create, or Delete pages for a database resource, read `doc/ui-page.md` for reference implementations, panel types, route conventions, and page patterns. Use the User Group pages as the canonical examples.

If the task conflicts with the documentation, call out the mismatch and prefer the documented behavior until the project documentation is updated.

Append prompts into the `prompt-history.md` file. Each prompt should have a clear title and a description of the task. If the prompt is related to a specific file, include the file path in the title. If the prompt is related to a specific feature or component, include the feature or component name in the title. Include the time the prompt was added.
