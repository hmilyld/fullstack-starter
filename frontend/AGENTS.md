# AGENTS.md

## Commands

```bash
pnpm dev        # Vite dev server
pnpm build      # tsc -b + vite build
pnpm typecheck  # tsc --noEmit (fast, no emit)
pnpm lint       # eslint
pnpm format     # prettier --write "**/*.{ts,tsx}"
```

No test framework exists. `pnpm build` doubles as the verification step.

## TypeScript strictness

- `verbatimModuleSyntax` — use `import type` for type-only imports
- `erasableSyntaxOnly` — no enums or namespaces
- `noUnusedLocals`, `noUnusedParameters` — unused vars cause build failure
- `strict: true` — all strict checks enabled

## Code style

- **No semicolons**, double quotes, 2-space indent (Prettier enforced)
- Tailwind class sorting via `prettier-plugin-tailwindcss`
- All icons from `lucide-react` only. Icons inside buttons need `data-icon="inline-start"` or `data-icon="inline-end"`. Never add sizing classes to icons inside components.
- Use `gap-*` not `space-y-*`. Use `size-*` when width equals height.
- Use `FieldGroup` + `Field` for form layout, not raw `div` with `space-y-*`
- **No `dark:` color overrides** — use semantic tokens (`bg-primary`, `text-muted-foreground`)

## shadcn/ui

- Style: `radix-rhea`. Never write shadcn components manually.
- Add components: `npx shadcn@latest add <name>`
- Config at `components.json` (aliases resolve to `@/components`, `@/lib`, `@/hooks`)

## Import alias

`@/` maps to `src/`. This is the only alias available.

## Architecture

- **Routing** (`src/router.tsx`): Auth pages (`/login`, `/register`) are standalone. All management pages are children of `AdminLayout`.
- **API layer** (`src/lib/api.ts`): All functions return `ApiResponse<T>` (`{ code, message, data }`). Success = `code === 0`.
- **Mock data** (`src/lib/mock-db.ts`): Uses localStorage with keys `mock_users`, `mock_roles`, `mock_menu_permissions`, `mock_operation_permissions`, `mock_system_config`. Seed data injected on first load.
- **Permissions** (`src/lib/permissions.ts`): Two-tier — `menu` (page access) and `operation` (CRUD actions). Operations link to menus via `parent`. Preset roles (`admin`, `user`) cannot be deleted.

## CRUD page pattern

Every settings page follows this structure:
1. Search input
2. Data table with `TableLoadingRow` / `TableEmptyRow`
3. `Pagination`
4. `Dialog` for create/edit
5. `ConfirmDeleteDialog` for delete
6. `LoadingButton` for submit

Forms: native HTML forms with `onSubmit` + `React.FormEvent`. Values read via `form.elements.namedItem()`. No form library.

## Adding new pages

1. Create page in `src/pages/<section>/<name>.tsx`
2. Add route in `src/router.tsx` (nested under `AdminLayout` for management pages)
3. Add menu item in `src/components/app-sidebar.tsx`
4. Add breadcrumb label in `src/components/header.tsx` `routeMap`
5. Add API functions in `src/lib/api.ts` and mock handlers in `src/lib/mock-db.ts`

## UI language

All UI text is in Chinese — labels, seed data, error messages, comments.

## Theme

Custom `ThemeProvider` (dark/light/system) stored in localStorage. Keyboard shortcut `d` toggles theme. CSS uses oklch color space via Tailwind v4 `@theme inline`.
