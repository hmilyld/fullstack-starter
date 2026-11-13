# Repository Guidelines

## Project Overview

**create-fullstack-app** is a scaffolding tool that generates fullstack admin panel projects. Users select a frontend framework (React/Vue/Svelte) and a backend framework (Python/Java), and the tool generates a complete project with authentication, user/role/permission/menu management, system settings, AI model management, audit logging, full-data import/export, a dashboard, and Docker deployment.

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
    ├── frontend-svelte/      # Svelte 5 (SvelteKit 3 SPA + TS + Tailwind CSS v4 + shadcn-svelte + Bits UI + PWA)
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

## Backend Coding Rules (templates/backend-python)

These are enforced by `ruff` and the contract suite, not just prose:

1. **Failures throw.** Never write to the database and then `return ApiResponse(code=-1)`. Raise `AppError` / `NotFoundError` / `ConflictError` / `InvalidOperationError` / `ForbiddenError`; `app/core/exceptions.py` maps them to the envelope. `get_db` commits only on normal return and rolls back on any exception.
2. **Routers do HTTP mapping only.** Parsing, dependency wiring and returning the envelope. Business rules and multi-step writes belong in `service.py`.
3. **Every endpoint declares `ApiResponse[T]`.** FastAPI derives the `response_model` from the return annotation, so this is what makes the OpenAPI response schema real. Returning a bare `dict` or `-> ApiResponse` produces a free-form object and fails `test_every_endpoint_declares_response_schema`.
4. **Pagination is clamped, not rejected.** Use `app.core.pagination.pagination_params`; `page`/`pageSize` out of range are clamped (contract requirement), so `Query(ge=..., le=...)` on those two is forbidden.
5. **ORM uses SQLAlchemy 2.0 style.** `Mapped` / `mapped_column`, never legacy `Column(...)`.
6. **Dependencies use `Annotated`.** `db: DbSession`, `current_user: CurrentUser`, and similar aliases per router.
7. **Schema changes go through Alembic.** Never `Base.metadata.create_all`; never hand-edit a database. `alembic revision --autogenerate` then review.
8. **Role names are not authorization.** Only `admin` (all permissions) and the "non-admin may not touch an admin account" rule may check a role name, each in exactly one place.
9. **Catalogs are the single source.** Permission codes and built-in menus live in `app/catalogs/` (`permissions.py`, `menus.py`). Never hardcode a permission list elsewhere; startup sync reads these modules. Adding a permission means editing this module **and** `catalog/PermissionCatalog.java` — `npm run sync:permissions:check` fails if the two drift, and the docs table is generated from them.

## Backend Coding Rules (templates/backend-java)

The same rules in Java form, enforced by `mvn spotless:check` and `ContractTest`:

1. **Failures throw.** Never write and then `return ApiResponse.error(...)` inside `@Transactional`. Throw `AppException` / `NotFoundException` / `ConflictException` / `InvalidOperationException` / `ForbiddenException`.
2. **Controllers map HTTP only.** No business rules, no multi-step writes.
3. **Every response is a `dto/*Response` record and every controller method declares `ApiResponse<T>`.** No `Map<String, Object>` in a controller or service return path, and never `ApiResponse<?>` — a wildcard degrades the schema to `ApiResponseObject` (arbitrary JSON) and fails `successEnvelopesAreTyped`. Only `GlobalExceptionHandler` may use the wildcard, since its `data` is always `null`.
4. **Pagination is clamped, not rejected.** `page`/`pageSize` are clamped in the service, never validated with `@Min`/`@Max`.
5. **Schema changes go through Flyway.** Never edit a migration that has already run. Seed **data** is different: permissions and built-in menus come from the catalogs (`PermissionCatalog`, `MenuCatalog`) via the startup sync runners, not from migrations. `V5__remove_seed_permissions.sql` cleared the last hand-written permission seed; do not add new ones.
6. **Formatting is not optional.** Run `mvn spotless:apply` after editing Java; `spotless:check` fails the build on drift.
7. **`data` is never omitted.** `ApiResponse` is annotated `@JsonInclude(ALWAYS)` and the global `default-property-inclusion` is `always`; null values must appear.

## Coding Style

- **Language**: TypeScript (ESM, `"type": "module"`)
- **Templates**: All UI text in **Chinese**. API responses use `{ code: 0, message: "success", data }`
- **Naming**: TS/JS uses `camelCase` variables, `PascalCase` components. Python schemas use `camelCase` (roleId), ORM uses `snake_case` (role_id)

## Business Logic Conventions

- **AuthZ is permission-based (RBAC), not role-name checks** — endpoints gate on permission codes (`users`, `users.create`, `roles.edit`, ...): Python uses `require_permission(...)` deps, Java uses `@SaCheckPermission`. Never hardcode `if role == admin` for API access control. Two role-name checks are deliberate and must stay in one place each: `admin` resolves to all permissions (Python `app/core/deps.py:load_permissions`, Java `StpInterfaceImpl`), and "a non-admin may not modify or delete an admin account" (Python `app/user/service.py`). Any new role-name check needs the same kind of justification.
- Default roles from seed: `admin` (all permissions), `user` (menu view perms only: `dashboard`, `users`, `settings`), `pending_review` (none). Registration assigns `pending_review` or `user` based on the manual-review system setting.
- **Permissions and built-in menus are seeded from code catalogs, not SQL.** Python `app/catalogs/{permissions,menus}.py`, Java `catalog/{PermissionCatalog,MenuCatalog}.java`, applied by startup sync. The two catalogs must stay identical; `npm run sync:permissions:check` enforces it and regenerates `reference/permissions.md` in the docs site. Never add permission rows to a migration.
- Both backends implement login/register rate limiting per IP and maintenance-mode blocking of non-admin logins.
- Frontend HTTP layer is a thin `fetch` wrapper (`api/client.ts` over `api/http.ts`) with automatic logout on 401 — do NOT introduce axios.
- Python backend rejects startup on weak/default `JWT_SECRET_KEY`; Java stack needs no secret key.
- **The API contract lives in `docs/contract/api.md`** and is enforced by `templates/backend-python/tests/test_contract.py`. It is the source of truth for paths, payloads, response shapes and semantics. Change it before changing either backend, then update both.
- **Logout revokes the token.** Python carries a per-user `users.token_version` in the JWT and bumps it on logout, password change and admin password reset; Java relies on Sa-Token session invalidation. A logged-out or rotated token must return `401`.
- Menu presentation is stored separately from permissions. `permissions` remains the authorization source; `menu_groups` and `menu_items` own grouping, route, icon, order, and sidebar visibility (`menu_items.hidden`). Built-in menu items cannot be deleted, and menus must be created, edited and deleted through the menu-management API/page (the permission API rejects `menu`-type mutations). Operation permissions are maintained inside the menu page; the standalone permission page is a read-only overview.
- `hidden` controls sidebar visibility only — it never revokes authorization. Hidden menus remain assignable in roles and remain reachable by direct route for users who hold the permission. Java upgrades add the column via `V3__menu_hidden.sql`; Python schema is Alembic-managed (`migrations/versions/`), so an existing Python database is upgraded automatically on startup.
- Menu sorting is global, fixed at two levels, and saved atomically on drop. Groups and menu items support cross-group dragging; operation permissions are sorted by code and do not participate in layout saves. Layout saves use `menu_layout_version` for optimistic locking. While a write is in flight, other structural mutations are disabled. Deleting a menu cascades to its operation permissions and role grants.
- Deleting a role hands its users to the system setting `defaultRoleId` (falling back to `user` when that role is missing or is the one being deleted) before removing the role and its grants. A `users.role_id` must never point at a deleted role. Python queries role permissions explicitly instead of walking the lazy `role.permissions` relationship: in an async session that raises `MissingGreenlet`, and after a write the identity map still holds the pre-update collection.
- `GET /api/menus` accepts `menus` or `permissions` so a role that can only manage operation permissions can still open the menu page; menu CRUD remains gated by `menus.*` and operation CRUD by `permissions.*`. The read-only permission overview is linked from the user menu for holders of `permissions`. Hiding the `menus` or `settings` menu requires an explicit confirmation because it removes its sidebar entry.
- Data management exports a password-protected ZIP containing `manifest.json`, `schema.sql`, `checksums.sha256`, and JSONL files for all business tables. Exports are same-backend/same-version only and omit runtime `app_state`.
- Imports validate the archive before restoring in one database transaction. During import all ordinary requests return `503`; the import status endpoint uses a one-time job token. Successful imports rotate `session_epoch` and invalidate all existing logins.

## Template Directory Conventions

Each stack follows its own idiomatic organization (do NOT unify them):

- **backend-python/** — domain modules: `app/core/` (infrastructure: config, runtime state, database, security, deps, pagination, exceptions, audit middleware, seed, permission/menu catalogs) + one package per business domain (`auth/`, `user/`, `role/`, `permission/`, `menu/`, `system/`, `ai_model/`, `audit/`, `data_management/`, `dashboard/`, `public/`), each containing `models.py` / `schemas.py` / `crud.py` / `service.py` / `router.py` as needed. `ApiResponse` / `PaginatedData` live in `app/core/schemas.py`. Routers do HTTP mapping only; business rules and transaction boundaries live in `service.py`. Schema changes go through Alembic (`migrations/`), never `create_all`. Do not commit `uv.lock` — it is gitignored and filtered out of generated projects; users resolve their own dependency versions on first `uv sync`.
- **backend-java/** — package-by-layer: `controller/`, `service/`, `repository/`, `entity/`, `dto/`, plus infrastructure packages `common/` (envelope, page result, exceptions, global handler), `config/` (Spring `@Configuration` classes only), `catalog/` (permission/menu data, no framework deps), `bootstrap/` (startup sync runners), `web/` (interceptors and filters), `data/` (import runtime state), `security/` (rate limiter, Sa-Token permission source). Keep those boundaries: a data catalog must not live in `config/`, or `service/` ends up importing the config package. Responses are typed records in `dto/` (`*Response`), never `Map<String, Object>`. Business failures throw `AppException` / `NotFoundException` / `ConflictException` / `InvalidOperationException` / `ForbiddenException`; `GlobalExceptionHandler` maps them to the envelope, so `@Transactional` rolls back. Schema changes go through Flyway (`db/migration`).
- **frontend-react/ & frontend-vue/ & frontend-svelte/** — 新增或修改页面前先读 `templates/frontend-react/DESIGN.md`（三套同构）：它是这三套前端的唯一视觉真源，也是新增模块的验收标准。feature-based: pages under `pages/settings/<Domain>/index.tsx` (React) or `index.vue` (Vue); Svelte uses SvelteKit routes under `src/routes/(app)/settings/<domain>/+page.svelte` with colocated subcomponents. API calls split by domain under `api/` (`client.ts` + `auth.ts`, `user.ts`, ...), types split by domain under `types/` (`common.ts` + per-domain). Shared technical code stays in `components/` (`shared/`, `ui/`), `lib/`, `hooks/` (React), `stores/` + `composables/` (Vue), and Svelte uses `src/lib/{api,types,components,stores,hooks}` with `#lib` subpath imports. No duplicate type definitions across files.

### API layer rules (frontend-react / frontend-vue / frontend-svelte)

- `api/http.ts` is infrastructure only (`BASE_URL`, query string, auth headers, `Content-Disposition` filename parsing, JSON/raw request). Only `api/client.ts` imports it; pages and domain files never do.
- `api/client.ts` exposes `apiClient` (`get` / `post` / `put` / `delete` / `download` / `upload` / `getWithHeaders`). The `get`/`post`/`put`/`delete` family returns `{ code, message, data }` and does not throw on network or HTTP errors; the raw family throws and keeps response headers.
- Domain files under `api/` export call functions only — no formatting, DOM work, toasts, or business orchestration. Non-request helpers go in `lib/` (e.g. `saveBlob` in `lib/download.ts`).
- Request/response/query-parameter types live in `types/<domain>.ts`; `api/` imports them with `import type`. Never declare a payload type inside `api/`.
- Domain files must not import each other; shared behaviour belongs in `lib/`, `hooks/` (React) or `composables/` (Vue).
- Keep `api/` flat by default. Only when one domain exceeds ~150 lines or needs a second file, promote `api/<domain>.ts` to `api/<domain>/index.ts` plus siblings. Do not nest ahead of need.
- React and Vue share byte-identical `src/api/` and `src/types/`; keep them in sync when changing either. The Svelte template keeps the same domain files and export signatures under `src/lib/api` and `src/lib/types`, using `#lib` imports with `.js` extensions.

## Frontend Responsive Rules (frontend-react / frontend-vue / frontend-svelte)

- Three modes: **Compact `< 768px`**, **Medium `768–1279px`**, **Expanded `≥ 1280px`**. Content max width is `1536px` (`--layout-max: 96rem`); below that the content fills the available width, so a collapsed sidebar widens it. Below 1280 the sidebar starts collapsed (icon rail) and any stored expanded state is ignored on load; dropping below 1280 at runtime collapses it too, without overwriting the saved desktop preference.
- Layout switches **by width**; control density switches by **input modality** (`pointer: coarse`) and compact width. Do not tie touch sizing only to a breakpoint.
- Compact: mobile Sheet nav (`ui/sidebar` built-in), card lists (`RecordCard`), filter bottom sheets, full-width page actions.
- Medium: icon rail, tables with priority columns, inline filters.
- Expanded: full sidebar, all columns.
- New list pages must provide cards below `md` and a table with column priorities above; reuse `PageHeader`, `ListShell`, `DataList` (column-driven table + cards + states), `ColumnToggle`, `RecordCard`, `RowActions`, `FormDialog`, `TablePagination`, `EmptyState`, `DateTimeField` (never the native `datetime-local`, which renders English `mm/dd/yyyy` inside the Chinese UI). The table header sticks under the app header; `Card` uses `overflow-clip` so sticky keeps working, and desktop tables must not need horizontal scrolling.
- Layout tokens live in `src/index.css` (React) / `src/assets/main.css` (Vue) / `src/routes/layout.css` (Svelte) (`--layout-gutter`, `--layout-max`, `--page-gap`, `--control-h`, `--icon-btn`, `--dialog-inset`). See `templates/frontend-react/DESIGN.md`, `templates/frontend-vue/DESIGN.md` and `templates/frontend-svelte/DESIGN.md` for the full spec and page checklist.
- PWA icons live in `templates/frontend-react/public/icons/`, `templates/frontend-vue/public/icons/` and `templates/frontend-svelte/static/icons/` (SVG, 192/512 PNG, 512 maskable, 180 apple-touch). When changing the brand mark, regenerate all sizes and keep the app entry HTML, `vite.config.ts`, `src/lib/pwa.ts` and `DESIGN.md` in sync for all three templates.
- List URL state uses `q` / `page`; audit filters use their own keys; AI presets use `presetQ` / `presetGroup`. Keep this contract in all three templates.
- The account menu (`UserMenu`) belongs in the header top-right, not in the sidebar footer. Keep this location in all templates.

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
   - Screenshots: `docs/images/` and the docs site's `public/shots/` hold the same set (README and the site share them); re-capture both after UI changes
   - The Astro Starlight site lives in the sibling repository `../fullstack-starter-docs`; its pages must match the templates just like `docs/`
4. Test: `npm run dev` → select option → verify generated project builds

## Testing

The scaffolding CLI has no automated tests; all three frontend templates include Vitest and Playwright (React/Vue use Testing Library, Svelte uses Vitest browser mode):

```bash
cd templates/frontend-react   # or templates/frontend-vue / templates/frontend-svelte
npm test
npm run test:coverage
npm run typecheck:e2e
npm run test:e2e        # first run: npx playwright install chromium
```

Vue uses `vue-tsc --noEmit -p tsconfig.app.json` for type checking and `@testing-library/vue` for component tests. Svelte uses `svelte-check` and Vitest browser mode (`vitest-browser-svelte`).

Design spec consistency is checked by a script (the docs site is not involved):

```bash
npm run sync:design:check   # 三份 DESIGN.md 结构一致；DESIGN.md 第 2.1 节的 Token 与三份全局 CSS 相同
```

The Python backend template carries the executable API contract:

```bash
cd templates/backend-python
uv sync --extra dev
uv run ruff check .
uv run pytest -q        # 32 contract assertions in tests/test_contract.py
```

`tests/test_contract.py` is the contract oracle: it asserts the exact endpoint set, response envelope, resource shapes and semantics from `docs/contract/api.md`. The Java backend runs the same assertions in `src/test/java/com/hmilyld/fullstack/ContractTest.java`; both must pass.

The permission docs table is generated, not hand-written:

```bash
npm run sync:permissions        # regenerate reference/permissions.md (zh + en)
npm run sync:permissions:check  # CI: fail if catalogs drift or docs are stale
npm run sync:permissions:catalog # CI without the docs repo: catalogs only
```

```bash
cd templates/backend-java
mvn spotless:apply      # format before committing
mvn test                # 28 contract assertions
```

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
