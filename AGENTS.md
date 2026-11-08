# Repository Guidelines

## Project Overview

**create-fullstack-app** is a scaffolding tool that generates fullstack admin panel projects. Users select a frontend framework (React/Vue) and a backend framework (Python/Java), and the tool generates a complete project with authentication, user/role/permission/menu management, system settings, AI model management, audit logging, full-data import/export, a dashboard, and Docker deployment.

## Project Structure

```
fullstack-starter/
├── src/
│   ├── index.ts              # CLI entry — interactive prompts
│   └── generator.ts          # Core generator — copies templates + generates config files
└── templates/
    ├── base/                 # Shared files (.gitignore)
    ├── frontend-react/       # React 19 (Vite + TS + Tailwind CSS v4 + shadcn/ui + PWA)
    ├── frontend-vue/         # Vue 3 (Vite + TS + Tailwind CSS v4 + shadcn-vue + Reka UI + Pinia + PWA)
    ├── backend-python/       # Python (FastAPI + SQLAlchemy async + SQLite, JWT via PyJWT)
    └── backend-java/         # Java (Spring Boot + JPA + SQLite/Flyway, auth via Sa-Token)
```

## Build & Development Commands

```bash
npm install           # Install dependencies
npm run build         # Compile TypeScript to dist/
npm run dev           # Run CLI directly via tsx (skip compilation)
node dist/index.js    # Run compiled CLI
```

## Coding Style

- **Language**: TypeScript (ESM, `"type": "module"`)
- **Templates**: All UI text in **Chinese**. API responses use `{ code: 0, message: "success", data }`
- **Naming**: TS/JS uses `camelCase` variables, `PascalCase` components. Python schemas use `camelCase` (roleId), ORM uses `snake_case` (role_id)

## Business Logic Conventions

- **AuthZ is permission-based (RBAC), not role-name checks** — endpoints gate on permission codes (`users`, `users.create`, `roles.edit`, ...): Python uses `require_permission(...)` deps, Java uses `@SaCheckPermission`. Never hardcode `if role == admin` for API access control.
- Default roles from seed: `admin` (all permissions), `user` (menu view perms only: `dashboard`, `users`, `settings`), `pending_review` (none). Registration assigns `pending_review` or `user` based on the manual-review system setting.
- Both backends implement login/register rate limiting per IP and maintenance-mode blocking of non-admin logins.
- Frontend HTTP layer is a thin `fetch` wrapper (`api/client.ts` over `api/http.ts`) with automatic logout on 401 — do NOT introduce axios.
- Python backend rejects startup on weak/default `JWT_SECRET_KEY`; Java stack needs no secret key.
- Menu presentation is stored separately from permissions. `permissions` remains the authorization source; `menu_groups` and `menu_items` own grouping, route, icon, order, and sidebar visibility (`menu_items.hidden`). Built-in menu items cannot be deleted, and menus must be created, edited and deleted through the menu-management API/page (the permission API rejects `menu`-type mutations). Operation permissions are maintained inside the menu page; the standalone permission page is a read-only overview.
- `hidden` controls sidebar visibility only — it never revokes authorization. Hidden menus remain assignable in roles and remain reachable by direct route for users who hold the permission. Java upgrades add the column via `V3__menu_hidden.sql`; Python uses `Base.metadata.create_all`, so existing Python databases need a manual `ALTER TABLE menu_items ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT 0;` and `UPDATE menu_items SET hidden = 1 WHERE permission_code = 'permissions';`.
- Menu sorting is global, fixed at two levels, and saved atomically on drop. Groups and menu items support cross-group dragging; operation permissions are sorted by code and do not participate in layout saves. Layout saves use `menu_layout_version` for optimistic locking. While a write is in flight, other structural mutations are disabled. Deleting a menu cascades to its operation permissions and role grants.
- `GET /api/menus` accepts `menus` or `permissions` so a role that can only manage operation permissions can still open the menu page; menu CRUD remains gated by `menus.*` and operation CRUD by `permissions.*`. The read-only permission overview is linked from the user menu for holders of `permissions`. Hiding the `menus` or `settings` menu requires an explicit confirmation because it removes its sidebar entry.
- Data management exports a password-protected ZIP containing `manifest.json`, `schema.sql`, `checksums.sha256`, and JSONL files for all business tables. Exports are same-backend/same-version only and omit runtime `app_state`.
- Imports validate the archive before restoring in one database transaction. During import all ordinary requests return `503`; the import status endpoint uses a one-time job token. Successful imports rotate `session_epoch` and invalidate all existing logins.

## Template Directory Conventions

Each stack follows its own idiomatic organization (do NOT unify them):

- **backend-python/** — domain modules: `app/core/` (infrastructure: config, runtime state, database, security, deps, audit middleware, seed, permission/menu catalogs) + one package per business domain (`auth/`, `user/`, `role/`, `permission/`, `menu/`, `system/`, `ai_model/`, `audit/`, `data_management/`, `dashboard/`, `public/`), each containing `models.py` / `schemas.py` / `crud.py` / `router.py` as needed. `ApiResponse` / `PaginatedData` live in `app/core/schemas.py`.
- **backend-java/** — package-by-layer: `controller/`, `service/`, `repository/`, `entity/`, `dto/`, plus `common/`, `config/`, `security/`.
- **frontend-react/ & frontend-vue/** — feature-based: pages under `pages/settings/<Domain>/index.tsx` (React) or `index.vue` (Vue), API calls split by domain under `api/` (`client.ts` + `auth.ts`, `user.ts`, ...), types split by domain under `types/` (`common.ts` + per-domain). Shared technical code stays in `components/` (`shared/`, `ui/`), `lib/`, `hooks/` (React), and (Vue) `stores/` + `composables/`. No duplicate type definitions across files.

### API layer rules (frontend-react / frontend-vue)

- `api/http.ts` is infrastructure only (`BASE_URL`, query string, auth headers, `Content-Disposition` filename parsing, JSON/raw request). Only `api/client.ts` imports it; pages and domain files never do.
- `api/client.ts` exposes `apiClient` (`get` / `post` / `put` / `delete` / `download` / `upload` / `getWithHeaders`). The `get`/`post`/`put`/`delete` family returns `{ code, message, data }` and does not throw on network or HTTP errors; the raw family throws and keeps response headers.
- Domain files under `api/` export call functions only — no formatting, DOM work, toasts, or business orchestration. Non-request helpers go in `lib/` (e.g. `saveBlob` in `lib/download.ts`).
- Request/response/query-parameter types live in `types/<domain>.ts`; `api/` imports them with `import type`. Never declare a payload type inside `api/`.
- Domain files must not import each other; shared behaviour belongs in `lib/`, `hooks/` (React) or `composables/` (Vue).
- Keep `api/` flat by default. Only when one domain exceeds ~150 lines or needs a second file, promote `api/<domain>.ts` to `api/<domain>/index.ts` plus siblings. Do not nest ahead of need.
- React and Vue share byte-identical `src/api/` and `src/types/`; keep them in sync when changing either.

## Frontend Responsive Rules (frontend-react / frontend-vue)

- Three modes: **Compact `< 768px`**, **Medium `768–1023px`**, **Expanded `≥ 1024px`**. Content max width is `1440px`.
- Layout switches **by width**; control density switches by **input modality** (`pointer: coarse`) and compact width. Do not tie touch sizing only to a breakpoint.
- Compact: mobile Sheet nav (`ui/sidebar` built-in), card lists (`RecordCard`), filter bottom sheets, full-width page actions.
- Medium: icon rail, tables with priority columns, inline filters.
- Expanded: full sidebar, all columns.
- New list pages must provide cards below `md` and a table with column priorities above; reuse `PageHeader`, `ListShell`, `RecordCard`, `RowActions`, `FormDialog`, `TablePagination`, `EmptyState`.
- Layout tokens live in `src/index.css` (React) / `src/assets/main.css` (Vue) (`--layout-gutter`, `--layout-max`, `--page-gap`, `--control-h`, `--icon-btn`, `--dialog-inset`). See `templates/frontend-react/DESIGN.md` and `templates/frontend-vue/DESIGN.md` for the full spec and page checklist.
- PWA icons live in `templates/frontend-react/public/icons/` and `templates/frontend-vue/public/icons/` (SVG, 192/512 PNG, 512 maskable, 180 apple-touch). When changing the brand mark, regenerate all sizes and keep `index.html`, `vite.config.ts`, `src/lib/pwa.ts` and `DESIGN.md` in sync for both templates.
- List URL state uses `q` / `page`; audit filters use their own keys; AI presets use `presetQ` / `presetGroup`. Keep this contract when refactoring the Vue template so both frontends behave the same.
- The account menu (`UserMenu`) belongs in the header top-right, not in the sidebar footer. Keep this location in the Vue template.

## Docker Architecture

Generated projects use a **single Docker image** containing Nginx + backend:
- Multi-stage build: Node builds frontend → backend stage runs both Nginx and backend process
- Nginx serves static files and proxies `/api/` to `127.0.0.1:8088`
- One container, one port (`5173`)

## Adding or Modifying Templates

1. Edit files in `templates/<name>/` — these are the exact files users receive
2. For new options, update `src/generator.ts`:
   - `FrontendType` / `BackendType` union types
   - `select()` choices in `src/index.ts`
   - `generateDockerfile()` for the new Dockerfile
3. When adding/changing a feature, keep documentation in sync — check **all** of the following before committing:
   - Feature list, module table and API tables in `docs/zh/README.md` and its English counterpart `docs/en/README.md`
   - This `AGENTS.md` (conventions and business-logic rules must match the code)
   - `generateReadme()` in `src/generator.ts` (the generated project's README)
4. Test: `npm run dev` → select option → verify generated project builds

## Testing

The scaffolding CLI has no automated tests; both frontend templates include Vitest, Testing Library and Playwright:

```bash
cd templates/frontend-react   # or templates/frontend-vue
npm test
npm run test:coverage
npm run typecheck:e2e
npm run test:e2e        # first run: npx playwright install chromium
```

Vue uses `vue-tsc --noEmit -p tsconfig.app.json` for type checking and `@testing-library/vue` for component tests.

Manual verification for the CLI:

```bash
npm run dev                                    # Generate test project
cd <project>/frontend && npm install && npm run build   # Verify frontend
cd <project>/backend && start backend                # Verify backend
docker build -t test . && docker run -p 5173:5173 test  # Verify Docker
```

## Commit Conventions

- Imperative mood: "Add feature", not "Added feature"
- Subject line under 72 characters
- Prefix with scope: `feat:`, `fix:`, `docs:`
