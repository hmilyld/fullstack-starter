> [简体中文](../zh/README.md) ｜ **English**

# create-fullstack-app

A full-stack application scaffolder — generate a system with a complete admin panel in one command.

## Features

- 🎨 **Choose a frontend**: React 19 (Vite + TypeScript + Tailwind CSS v4 + shadcn/ui, with PWA support) or Vue 3 (Vite + TypeScript + Tailwind CSS v4 + DaisyUI)
- ⚙️ **Choose a backend**: Python (FastAPI) or Java (Spring Boot)
- 🔐 **Authentication built in**: login, registration, logout (Python uses JWT, Java uses Sa-Token), maintenance mode, and manual review
- 🧩 **Complete modules**: users, roles, permissions, menus, system settings, AI models and presets, audit logs, data management, dashboard
- 🐳 **Docker ready**: single-image deployment with an Nginx reverse proxy
- 📊 **Works out of the box**: dashboard stats, user/role/permission CRUD, paginated search, personal settings

## Features of the Generated Project

| Module | Features |
|--------|----------|
| Authentication | Token login, registration, logout, login/registration rate limiting, automatic logout on 401 |
| Dashboard | Stat cards + recent activity |
| User management | List + pagination + search + detail + create/edit + delete + reset password + batch role assignment |
| Role management | List + pagination + search + create/edit + delete (preset roles cannot be deleted) |
| Permission management | Menu permissions + operation permissions; operation permissions can be created/edited/deleted, menu permissions are maintained in Menu Management; auto-synced with the permission catalog at startup |
| Menu management | Group and menu maintenance, cross-group dragging, global ordering, permission-filtered dynamic sidebar |
| System settings | Read/write site configuration, email test, maintenance mode (blocks non-admin logins), open registration, manual review |
| AI models | List / default / lookup by alias / detail / create / edit / delete / connection test |
| AI model presets | Grouping, activate a preset, list / create / edit / delete |
| Audit logs | Records of write operations and permission denials, filtered by user/status/action/time, paginated view |
| Data management | AES-encrypted full export, same-version full import, global freeze during import, all sessions invalidated |
| Profile | Edit profile, change password |
| Device support | Designed for desktop and tablet; phones are prompted to switch devices |

Default accounts: `admin / 123456` (the only administrator); `zhangsan / lisi / wangwu / zhaoliu` all use the password `123456` (regular users). New accounts are assigned the "pending review" or "regular user" role according to system settings.

API authorization is based on permission points (RBAC): the default `admin` role has all permissions; the `user` (regular user) role has view permission only for the `dashboard`, `users`, and `settings` menus; `pending_review` has no permissions.

## Repository Structure

```
fullstack-starter/
├── package.json                # npm package configuration
├── tsconfig.json               # TypeScript compiler configuration
├── README.md                   # This file
├── src/
│   ├── index.ts                # CLI entry (interactive frontend/backend/project-name selection)
│   └── generator.ts            # Project generator (copies templates + generates config files)
└── templates/
    ├── base/                   # Base template (.gitignore)
    ├── frontend-react/         # Complete React frontend template
    ├── frontend-vue/           # Complete Vue frontend template
    ├── backend-python/         # Complete Python FastAPI backend template
    └── backend-java/           # Complete Java Spring Boot backend template
```

## Quick Start

### Install & Build

```bash
npm install
npm run build
```

### Run

```bash
# Development mode (skip compilation, run TypeScript directly)
npm run dev

# Or run the compiled version
node dist/index.js
```

### Interactive Selection

The CLI prompts are currently in Chinese.

```
? 请选择前端框架: (Use arrow keys)
  ❯ React
    Vue

? 请选择后端框架: (Use arrow keys)
  ❯ Python (FastAPI)
    Java (Spring Boot)

? 请输入项目名称: my-project
```

The generated project appears in the current directory.

## Generated Project Structure

```
my-project/
├── frontend/                # Frontend project
│   ├── src/
│   │   ├── api/             # API layer (fetch wrapper + split by domain)
│   │   ├── types/           # Type definitions (split by domain)
│   │   ├── pages/           # auth, dashboard, settings/{user,role,permission,menu,system,ai-model,audit-log,data-management,profile}
│   │   ├── components/      # Shared components (shared/; React also has ui/)
│   │   ├── router(.tsx or /index.ts)  # Routes (protected routes)
│   │   └── stores/(Vue) or lib/(React) # Global state such as auth
│   ├── vite.config.ts       # Dev proxy /api → localhost:8088
│   └── package.json
├── backend/                 # Backend project
│   ├── app/                 # Python FastAPI (core + auth/user/role/permission/menu/system/dashboard/ai_model/audit/data_management/public)
│   └── src/main/java/...    # Java Spring Boot (controller/service/repository/entity/config/common/security/dto)
├── dev.sh                   # Dev script (start/stop/restart/install)
├── build.sh                 # Build script
├── Dockerfile               # Single image: frontend build + backend + Nginx
├── docker-compose.yml       # Docker orchestration
├── .dockerignore            # Docker build exclusions
├── nginx.conf               # Nginx config (reverse proxy /api → backend)
└── README.md
```

## Port Configuration

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Development | 5173 | 8088 |
| Docker | 5173 | 8088 |

## Development Guide

### Modifying Templates

Edit files under `templates/` directly, just like editing a normal project. Template files are exactly what users receive.

```bash
# Example: add a log page to the React frontend
touch templates/frontend-react/src/pages/log/LogList.tsx
# Then add the route in router.tsx, the menu entry in app-sidebar.tsx, and the API call under api/
```

### Adding a Template

```bash
# 1. Create the template directory
mkdir -p templates/frontend-svelte

# 2. Build a complete project inside it

# 3. Update src/generator.ts
#    - Update the FrontendType / BackendType types
#    - Update the choices array in index.ts
#    - Update the Dockerfile generation logic in generator.ts
```

### Testing

```bash
npm run dev
# Choose frontend/backend/project name, then verify the generated project:
cd <generated project>/frontend && npm install && npm run build
cd <generated project>/backend && start the backend
```

## Tech Stack

| Component | React template | Vue template |
|-----------|----------------|--------------|
| Framework | React 19 | Vue 3.5+ (Composition API) |
| Build | Vite | Vite |
| Language | TypeScript | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (with PWA) | Tailwind CSS v4 + DaisyUI |
| HTTP | Native fetch wrapper (auto logout on 401) | Native fetch wrapper (auto logout on 401) |
| Routing | react-router v7 | vue-router v4 |
| State | React Context (lib/) | Pinia (stores/) |
| Icons | lucide-react | lucide-vue-next |

| Component | Python template | Java template |
|-----------|-----------------|---------------|
| Framework | FastAPI | Spring Boot 3.2 |
| ORM | SQLAlchemy 2.0 (async) | Spring Data JPA |
| Database | SQLite (aiosqlite) | SQLite file (./data/app.db, Flyway migrations) |
| Auth | PyJWT + bcrypt | Sa-Token (UUID-style token) + BCrypt |
| Secret | Env var `JWT_SECRET_KEY` (refuses to start on a weak key) | No secret needed (Sa-Token server-side session token) |

## API Reference

Except for the file download endpoint, every endpoint returns: `{ code: 0, message: "success", data: ... }` (errors return `code: -1`). `/api/data/export` returns a ZIP file directly on success.

> In the "Auth" column, `Yes(permission code)` means a token is required together with the given permission point (e.g. `users`, `users.create`); a bare `Yes` means any logged-in user. The Python build returns 401 when not logged in. The two stacks behave identically except for `logout`: the Java build also returns success when called without a login.

### Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/auth/login | Login | No |
| POST | /api/auth/register | Register (controlled by the open-registration / manual-review settings) | No |
| POST | /api/auth/logout | Logout | Yes¹ |

### Users

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/users | User list (pagination + search) | Yes(users) |
| GET | /api/users/:id | User detail | Yes(users) |
| POST | /api/users | Create user | Yes(users.create)² |
| PUT | /api/users/:id | Update user | Yes(users.edit) |
| DELETE | /api/users/:id | Delete user | Yes(users.delete) |
| PUT | /api/users/:id/reset-password | Reset password | Yes(users.edit) |
| POST | /api/users/batch-role | Batch set roles | Yes(users.edit or users.assign_role) |
| PUT | /api/users/me | Update own profile | Yes |
| PUT | /api/users/me/password | Change own password | Yes |

### Roles and Permissions

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/roles | Role list (pagination + search) | Yes(roles) |
| POST | /api/roles | Create role | Yes(roles.create) |
| PUT | /api/roles/:id | Update role | Yes(roles.edit) |
| DELETE | /api/roles/:id | Delete role (preset roles cannot be deleted) | Yes(roles.delete) |
| GET | /api/permissions | Permission list | Yes(permissions) |
| POST | /api/permissions | Create operation permission | Yes(permissions.create)³ |
| POST | /api/permissions/sync | Sync with the permission catalog | Yes(permissions.create) |
| PUT | /api/permissions/:code | Update operation permission | Yes(permissions.edit)³ |
| DELETE | /api/permissions/:code | Delete operation permission | Yes(permissions.delete)³ |

### Menu Management

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/menus/navigation | Current user's dynamic sidebar | Yes |
| GET | /api/menus | Menu configuration and current layout version | Yes(menus) |
| POST | /api/menus/groups | Create a custom group | Yes(menus.create) |
| PUT | /api/menus/groups/:id | Rename a group | Yes(menus.edit) |
| DELETE | /api/menus/groups/:id | Delete an empty custom group | Yes(menus.delete) |
| POST | /api/menus/items | Create a custom menu and its permission | Yes(menus.create) |
| PUT | /api/menus/items/:code | Edit a menu's name, group, route, or icon | Yes(menus.edit) |
| DELETE | /api/menus/items/:code | Delete a custom menu and its permission grant | Yes(menus.delete) |
| PUT | /api/menus/layout | Atomically save group and menu order | Yes(menus.reorder) |

### Dashboard

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/dashboard/stats | Stat cards | Yes(dashboard) |
| GET | /api/dashboard/activity | Recent activity | Yes(dashboard) |

### System Settings

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/system/config | Read configuration | Yes(settings) |
| PUT | /api/system/config | Update configuration | Yes(settings.edit) |
| POST | /api/system/test-email | Test email | Yes(settings.edit) |
| GET | /api/public/config | Public configuration (used by the login page) | No |

### AI Models

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/ai-models | Model list | Yes(ai_models) |
| POST | /api/ai-models | Create model | Yes(ai_models.create) |
| GET | /api/ai-models/default | Default model | Yes(ai_models) |
| GET | /api/ai-models/by-alias/:alias | Look up by alias | Yes(ai_models) |
| GET | /api/ai-models/:id | Model detail | Yes(ai_models) |
| PUT | /api/ai-models/:id | Update model | Yes(ai_models.edit) |
| DELETE | /api/ai-models/:id | Delete model | Yes(ai_models.delete) |
| POST | /api/ai-models/test | Connection test | Yes(ai_models) |
| GET | /api/ai-models/presets | Preset list | Yes(ai_models) |
| GET | /api/ai-models/presets/groups | Preset groups | Yes(ai_models) |
| GET | /api/ai-models/presets/active | Currently active preset | Yes(ai_models) |
| GET | /api/ai-models/presets/:id | Preset detail | Yes(ai_models) |
| POST | /api/ai-models/presets | Create preset | Yes(ai_models.create or ai_models.presets.create) |
| PUT | /api/ai-models/presets/:id | Update preset | Yes(ai_models.edit or ai_models.presets.edit) |
| DELETE | /api/ai-models/presets/:id | Delete preset | Yes(ai_models.delete or ai_models.presets.delete) |

### Audit Logs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/audit-logs | Audit log list (filtered by user/status/action/time + pagination) | Yes(audit_logs) |

### Data Management

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/data/export | Download the encrypted full export package | Yes(data_management.export) |
| POST | /api/data/import | Upload and create a full import job | Yes(data_management.import) |
| GET | /api/data/import/:id | Query import status with a one-time job token | One-time job token |

Export packages can only be restored on the same backend, same application version, and same database schema. A package contains `manifest.json`, `schema.sql`, `checksums.sha256`, and JSONL data for each business table; the runtime `app_state` is not included in the export package. A successful import updates the global session epoch, so every logged-in user must log in again.

> Note 1: In the Python build, logout requires a login; the Java build also accepts unauthenticated calls.
> Note 2: Creating a user with a non-default role also requires the `users.assign_role` permission.
> Note 3: Creating/updating/deleting a `menu`-type permission through the permission API is rejected (returns `code: -1`); maintain menu permissions through the Menu Management endpoints above.

## License

MIT
