# AGENTS.md

## Commands

```bash
pnpm dev        # Vite dev server (port 5174)
pnpm build      # vue-tsc -b + vite build
pnpm lint       # eslint
```

No test framework exists. `pnpm build` doubles as the verification step.

## TypeScript strictness

- `strict: true` — all strict checks enabled
- `noUnusedLocals`, `noUnusedParameters` — unused vars cause build failure
- Use `import type` for type-only imports

## Code style

- No semicolons, single quotes, 2-space indent
- Use `<script setup>` syntax for all components
- Use `gap-*` not `space-y-*`
- Use DaisyUI class names for all UI components
- **No `dark:` color overrides** — use DaisyUI theme system

## DaisyUI

- All UI components use DaisyUI 5 class names
- Never write custom component styles when DaisyUI provides them
- Theme switching via `data-theme` attribute
- Components: `.btn`, `.card`, `.modal`, `.table`, `.menu`, etc.

## Import alias

`@/` maps to `src/`. This is the only alias available.

## Architecture

- **Routing** (`src/router/index.ts`): Auth pages (`/login`, `/register`) are standalone. All management pages are children of `AdminLayout`.
- **State** (`src/stores/`): Pinia stores for auth, theme, and site config.
- **API layer** (`src/lib/api.ts`): All functions return `ApiResponse<T>` (`{ code, message, data }`). Success = `code === 0`.
- **Permissions** (`src/lib/permissions.ts`): Two-tier — `menu` (page access) and `operation` (CRUD actions). Operations link to menus via `parent`. Preset roles (`admin`, `user`) cannot be deleted.

## CRUD page pattern

Every settings page follows this structure:
1. Search input
2. Data table with loading skeleton
3. `Pagination` component
4. Modal dialog for create/edit
5. `ConfirmDeleteDialog` for delete
6. Loading state on buttons

Forms: Vue reactive forms with `v-model` and `@submit.prevent`.

## Adding new pages

1. Create page in `src/pages/<section>/<Name>.vue`
2. Add route in `src/router/index.ts` (nested under `AdminLayout` for management pages)
3. Add menu item in `src/components/AppSidebar.vue`
4. Add breadcrumb label in `src/components/AppHeader.vue` `routeMap`
5. Add API functions in `src/lib/api.ts`

## UI language

All UI text is in Chinese — labels, seed data, error messages, comments.

## Theme

Pinia store (`stores/theme.ts`) manages theme state. Uses DaisyUI's `data-theme` attribute. Keyboard shortcut `d` toggles theme. Supports light/dark/system modes.
