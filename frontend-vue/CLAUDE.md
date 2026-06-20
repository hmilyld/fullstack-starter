# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Vite) on port 5174
pnpm build        # Type-check + production build
pnpm lint         # ESLint
pnpm preview      # Preview production build
```

No test framework is configured.

## Tech Stack

Vue 3 + TypeScript 5.7 + Vite 6 + Tailwind CSS 4 + DaisyUI 5 + Vue Router 4 + Pinia 3. All data comes from the backend API — no mock data.

## Project Structure

```
src/
├── main.ts                 # App entry
├── App.vue                 # Root component
├── assets/main.css         # Tailwind + DaisyUI config
├── router/index.ts         # All routes defined here
├── stores/                 # Pinia stores
│   ├── auth.ts             # Auth state (user, token, permissions)
│   ├── theme.ts            # Theme management
│   └── site-config.ts      # Site configuration
├── composables/            # Vue composables
│   ├── use-mobile.ts       # Mobile detection
│   └── use-toast.ts        # Toast notifications
├── lib/
│   ├── api-client.ts       # HTTP client (fetch wrapper)
│   ├── api.ts              # API functions
│   └── permissions.ts      # Permission seed data
├── components/
│   ├── AppSidebar.vue      # Sidebar navigation
│   ├── AppHeader.vue       # Header with breadcrumbs
│   ├── ThemeToggle.vue     # Theme switcher
│   ├── ToastContainer.vue  # Toast notifications
│   └── shared/             # Reusable components
├── layouts/
│   └── AdminLayout.vue     # Main layout (sidebar + header + content)
└── pages/
    ├── auth/               # Login, Register (standalone)
    ├── dashboard/          # Dashboard page
    ├── settings/           # All CRUD pages
    └── NotFound.vue
```

## Architecture

**Routing:** Auth pages (`/login`, `/register`) are standalone. All management pages are children of `AdminLayout`.

**State Management:** Pinia stores for auth, theme, and site config. Auth store persists user/token to localStorage.

**API Layer:** All functions in `src/lib/api.ts` return `ApiResponse<T>` (`{ code, message, data }`). Success = `code === 0`. The API client handles JWT token injection and 401 redirects.

**Permissions:** Two-tier system — `menu` permissions (page access) and `operation` permissions (CRUD operations). Operations link to menus via `parent` field.

**Theme:** Pinia store for theme management (dark/light/system). Uses DaisyUI's `data-theme` attribute. Keyboard shortcut `d` toggles theme.

## Conventions

- **Import alias:** `@/` maps to `src/`
- **Components:** Use `<script setup>` syntax
- **State:** Pinia for global state, `ref`/`reactive` for local state
- **UI Library:** DaisyUI 5 — never write custom component classes
- **Icons:** Lucide Vue only
- **All UI text is in Chinese**

## Adding New Pages

1. Create page in `src/pages/<section>/<Name>.vue`
2. Add route in `src/router/index.ts` (nested under `AdminLayout` for management pages)
3. Add menu item in `src/components/AppSidebar.vue`
4. Add breadcrumb label in `src/components/AppHeader.vue` `routeMap`
5. Add API functions in `src/lib/api.ts`
