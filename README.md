# poc-baseportal-next-ts-v1

A Next.js application built with TypeScript, Tailwind CSS, pnpm, and shadcn UI components.

## Features

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **shadcn UI** component library
- **pnpm** for package management
- **ESLint** for code linting
- **Prettier** with automatic formatting check before build

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (install with `npm install -g pnpm`)

### Installation

```bash
pnpm install
```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build the application for production:

```bash
pnpm build
```

The build command will:

1. Check code formatting with Prettier
2. Build the Next.js application

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production (includes format check)
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

## Project Structure

```
poc-baseportal-next-ts-v1/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   └── ui/          # shadcn UI components
│   └── lib/             # Utility functions
├── .prettierrc.json      # Prettier configuration
├── eslint.config.mjs     # ESLint configuration
├── tailwind.config.ts    # Tailwind configuration
└── package.json          # Dependencies and scripts
```

## Copilot Instructions

Project-wide agent instructions live in [.github/copilot-instructions.md](.github/copilot-instructions.md).

That file defines the default guidance for AI-assisted work in this repository, including the requirement to read the Markdown files in the `doc` folder before making changes.

## UI Components

The home page includes:

- A responsive container with max-width
- A top panel with title and description
- "Hello world" heading
- A button component from shadcn UI

## Adding New shadcn Components

This project is already configured for shadcn UI through [components.json](components.json). The current setup uses:

- `new-york` style
- React Server Components (`rsc: true`)
- Tailwind CSS variables in `src/app/globals.css`
- UI components generated into `src/components/ui`

When you need a new component, add it with the shadcn CLI from the project root:

```bash
pnpm dlx shadcn@latest add button
```

The CLI will:

- Create the component file in `src/components/ui`
- Install any missing dependencies
- Update related files when required

### Common Examples

Add a single component:

```bash
pnpm dlx shadcn@latest add input
```

Add a few related components together:

```bash
pnpm dlx shadcn@latest add card input label button
```

Add a more interactive component set:

```bash
pnpm dlx shadcn@latest add dialog dropdown-menu tabs
```

Preview a component before installing it:

```bash
pnpm dlx shadcn@latest view dialog
```

Open CLI docs for a specific component:

```bash
pnpm dlx shadcn@latest docs dialog
```

Search the registry when you are not sure what component name to use:

```bash
pnpm dlx shadcn@latest search @shadcn -q "table"
```

### Usage Samples

Install and use a button:

```bash
pnpm dlx shadcn@latest add button
```

```tsx
import { Button } from '@/components/ui/button';

export function SaveAction() {
  return <Button>Save changes</Button>;
}
```

Install and use card primitives:

```bash
pnpm dlx shadcn@latest add card
```

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SummaryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project status</CardTitle>
        <CardDescription>Latest deployment summary</CardDescription>
      </CardHeader>
      <CardContent>Everything is healthy.</CardContent>
    </Card>
  );
}
```

Install and use a dialog:

```bash
pnpm dlx shadcn@latest add dialog
```

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function ConfirmDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
        </DialogHeader>
        Continue with the operation.
      </DialogContent>
    </Dialog>
  );
}
```

### Where To Find Components

- Main component list: [https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)
- Community registry directory: [https://ui.shadcn.com/docs/directory](https://ui.shadcn.com/docs/directory)
- CLI reference: [https://ui.shadcn.com/docs/cli](https://ui.shadcn.com/docs/cli)

### Recommended Workflow

1. Check the component catalog and pick the closest primitive or pattern.
2. Run `pnpm dlx shadcn@latest add <component-name>`.
3. Import the generated component from `@/components/ui/...`.
4. Compose project-specific wrappers in `src/components` if the UI will be reused with custom business logic.
5. Run `pnpm lint` and `pnpm build` after adding more complex components.

## Code Quality

The project enforces code quality through:

- **ESLint** - Configured with Next.js recommended rules
- **Prettier** - Automatic code formatting with Tailwind CSS class sorting
- **Pre-build checks** - Format validation runs before every build

To format your code manually:

```bash
pnpm format
```

To check formatting without making changes:

```bash
pnpm format:check
```
