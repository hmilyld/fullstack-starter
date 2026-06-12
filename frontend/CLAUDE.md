# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Vite)
pnpm build        # Type-check + production build
pnpm typecheck    # Type-check only (no emit)
pnpm lint         # ESLint
pnpm format       # Prettier (all .ts/.tsx)
pnpm preview      # Preview production build
```

No test framework is configured.

## Tech Stack

React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + shadcn/ui v4 + React Router 7 + PWA (vite-plugin-pwa). All data is mocked via localStorage — no backend.

## Project Structure

```
src/
  router.tsx              # All routes defined here
  components/
    ui/                   # shadcn/ui components (managed via CLI)
    shared/               # Reusable app components (LoadingButton, Pagination, etc.)
  pages/
    auth/                 # Login, Register (outside admin layout)
    dashboard/            # Dashboard page
    settings/             # All CRUD pages (user, role, permission, profile, system)
  lib/
    api.ts                # Unified API layer (wraps mock-db, returns ApiResponse<T>)
    mock-db.ts            # localStorage mock database with seed data
    permissions.ts        # Permission seed data and types
  types/api.ts            # All TypeScript type definitions
  hooks/                  # Custom hooks (useMobile, useSaveAction)
```

## Architecture

**Routing:** Auth pages (`/login`, `/register`) are standalone. All management pages are children of `AdminLayout` (sidebar + header + footer + Outlet).

**API Layer:** All functions in `src/lib/api.ts` return `ApiResponse<T>` (`{ code, message, data }`). Success = `code === 0`. The mock layer (`mock-db.ts`) simulates async delays.

**Permissions:** Two-tier system — `menu` permissions (page access) and `operation` permissions (CRUD actions). Operations link to menus via `parent` field. Preset roles (`admin`, `user`) cannot be deleted.

**CRUD Page Pattern:** Every settings page follows: search input → data table (with `TableLoadingRow`/`TableEmptyRow`) → `Pagination` → `Dialog` for create/edit → `ConfirmDeleteDialog` for delete → `LoadingButton` for submit.

**Forms:** Native HTML forms with `onSubmit` + `React.FormEvent`. Values read via `form.elements.namedItem()`. No form library.

**Theme:** Custom `ThemeProvider` (dark/light/system), stored in localStorage. Keyboard shortcut `d` toggles theme. CSS uses oklch color space via Tailwind v4 `@theme inline`.

## Conventions

- **Import alias:** `@/` maps to `src/` (only alias available)
- **shadcn/ui components:** Add via `npx shadcn@latest add <component>`, never write manually
- **TypeScript:** `verbatimModuleSyntax` (use `import type` for type-only imports), `erasableSyntaxOnly` (no enums/namespaces), `noUnusedLocals`
- **Prettier:** No semicolons, double quotes, 2-space indent, `prettier-plugin-tailwindcss` for class sorting
- **Icons:** Lucide React only. Icons inside buttons need `data-icon="inline-start"` or `data-icon="inline-end"`. Never add sizing classes to icons inside components.
- **Spacing:** Use `gap-*` not `space-y-*`. Use `size-*` when width equals height.
- **Forms:** Use `FieldGroup` + `Field` for layout, not raw `div` with `space-y-*`
- **Loading states:** Use shared `LoadingButton`, `TableLoadingRow`, `TableEmptyRow` components
- **All UI text is in Chinese** — labels, seed data, error messages, comments
- **No `dark:` color overrides** — use semantic tokens (`bg-primary`, `text-muted-foreground`)

## Adding New Pages

1. Create page in `src/pages/<section>/<name>.tsx`
2. Add route in `src/router.tsx` (nested under `AdminLayout` for management pages)
3. Add menu item in `src/components/app-sidebar.tsx`
4. Add breadcrumb label in `src/components/header.tsx` `routeMap`
5. Add API functions in `src/lib/api.ts` and mock handlers in `src/lib/mock-db.ts`
