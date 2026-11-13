# Fullstack Forge

**One command, a production-ready admin system.** Pick React, Vue or Svelte for the frontend and FastAPI or Spring Boot for the backend — all six combinations share one API contract and one visual spec.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](package.json)
[![Docs](https://img.shields.io/badge/docs-fullstack.hmilyld.com-blue)](https://fullstack.hmilyld.com)

English ｜ [简体中文](docs/zh/README.md)

[`create-fullstack-app`](https://github.com/hmilyld/fullstack-starter) is both the generator and the maintenance repository for the templates. Every template is a complete project that can run and deploy on its own.

![Dashboard](docs/images/dashboard.webp)

## Six combinations

|              | Python · FastAPI                                                                     | Java · Spring Boot                                                               |
| ------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **React 19** | React + Vite + Tailwind v4 + shadcn/ui ／ FastAPI + SQLAlchemy 2 + Alembic           | React + Vite + Tailwind v4 + shadcn/ui ／ Spring Boot 3 + JPA + Flyway           |
| **Vue 3**    | Vue 3 + Vite + Tailwind v4 + shadcn-vue ／ FastAPI + SQLAlchemy 2 + Alembic          | Vue 3 + Vite + Tailwind v4 + shadcn-vue ／ Spring Boot 3 + JPA + Flyway          |
| **Svelte 5** | SvelteKit 3 + Vite + Tailwind v4 + shadcn-svelte ／ FastAPI + SQLAlchemy 2 + Alembic | SvelteKit 3 + Vite + Tailwind v4 + shadcn-svelte ／ Spring Boot 3 + JPA + Flyway |

All six routes share **one API contract** ([`docs/contract/api.md`](docs/contract/api.md)), one permission catalog and one visual spec:

- Swap the frontend, keep the backend: the same FastAPI service can serve the React, Vue and Svelte templates with identical paths, fields and error codes.
- Swap the backend, keep the frontend: the frontend only understands the `{ code, message, data }` envelope, so the Python and Java implementations are interchangeable.
- The three frontends stay aligned at the pixel and interaction level: the same layout, components and keyboard shortcuts.

## What you get

This is not an empty shell. Every generated project ships with authentication, RBAC, menu management, audit logs, data management and a dashboard.

> The seeded local administrator is `admin / 123456`, and the sample users share the same password. This is only for a fresh local project — change every seeded password and the backend secret before exposing a generated project to a network. See [SECURITY.md](SECURITY.md).

| Login                            | User management                            |
| -------------------------------- | ------------------------------------------ |
| ![Login](docs/images/login.webp) | ![User management](docs/images/users.webp) |

| System settings                               | Audit logs                                 |
| --------------------------------------------- | ------------------------------------------ |
| ![System settings](docs/images/settings.webp) | ![Audit logs](docs/images/datepicker.webp) |

Dark mode and responsive layouts are built in, not an add-on:

| Dark mode                                     | Tablet (icon rail)                 | Phone (card lists)                |
| --------------------------------------------- | ---------------------------------- | --------------------------------- |
| ![Dark mode](docs/images/dashboard-dark.webp) | ![Tablet](docs/images/tablet.webp) | ![Phone](docs/images/mobile.webp) |

## Built-in capabilities

- **Authentication and security**: login / registration / logout (JWT for Python with revocation on logout, Sa-Token for Java), login and registration rate limiting, maintenance mode, manual review, automatic logout on 401
- **RBAC**: permission codes for both menus and operations; permission and menu catalogs are the source of truth and are checked for drift across Python and Java
- **Menu management**: tree structure, cross-group dragging, save on drop, show/hide, permission-filtered sidebar
- **Users and roles**: CRUD, paginated search, batch role assignment, password reset, automatic handover of users when a role is deleted
- **System settings**: site configuration, email test, open registration, maintenance mode, manual review
- **AI models**: model and preset management, connection tests, default model lookup by alias
- **Audit logs**: write operations and permission denials, filtered by user / status / action / time
- **Data management**: AES-encrypted full export, same-version full import, global freeze during import, forced re-login afterwards
- **List experience**: per-table column visibility and density (remembered), page size, sticky headers, multi-select bulk actions, card lists on phones
- **Interaction details**: ⌘K command palette (with recent pages), appearance drawer (theme / sidebar variant), unsaved-changes warning
- **PWA + Docker**: installable frontend; single-image deployment with Nginx and the backend

## Quick start

The CLI is packaged as [`@hmilyld/create-fullstack-app`](https://github.com/hmilyld/fullstack-starter). The first public npm release is pending, so run it from a source checkout today:

```bash
git clone https://github.com/hmilyld/fullstack-starter.git
cd fullstack-starter
pnpm install
pnpm run build
pnpm run dev
```

Choose a frontend and backend when prompted:

```text
? Select a frontend: React / Vue / Svelte
? Select a backend: Python (FastAPI) / Java (Spring Boot)
? Project name: my-project
```

Generated projects include `dev.sh`, `build.sh`, `Dockerfile` and `docker-compose.yml`; follow the generated `README.md` to run and deploy them.

## Documentation

- **English**: [`docs/en/README.md`](docs/en/README.md)
- **简体中文**: [`docs/zh/README.md`](docs/zh/README.md)
- **Online documentation**: <https://fullstack.hmilyld.com>
- **API contract**: [`docs/contract/api.md`](docs/contract/api.md)

## Repository structure

```text
fullstack-starter/
├── src/                       # Generator CLI (prompts, template copy, generated files)
├── scripts/                   # Maintenance scripts and CI helpers
├── templates/
│   ├── frontend-react/        # Complete React 19 frontend (unit + e2e tests)
│   ├── frontend-vue/          # Complete Vue 3 frontend (unit + e2e tests)
│   ├── frontend-svelte/       # Complete Svelte 5 frontend (unit + e2e tests)
│   ├── backend-python/        # Complete FastAPI backend (contract tests)
│   └── backend-java/          # Complete Spring Boot backend (contract tests)
└── docs/                      # Guides, API contract, screenshots
```

Template directories are the product: editing `templates/<name>/` is how you change what users receive. There is no second copy to synchronise.

## Development and validation

```bash
# Generator
pnpm run format:check
pnpm run lint
pnpm run typecheck:test
pnpm run build
pnpm test
pnpm run sync:permissions:catalog
pnpm run sync:design:check
pnpm run sync:version:check

# Frontend templates
cd templates/frontend-react && npm test && npm run build
cd templates/frontend-vue && npm test && npm run build
cd templates/frontend-svelte && npm test && npm run build

# Backend templates
cd templates/backend-python && uv run ruff check . && uv run pytest -q
cd templates/backend-java && mvn spotless:check && mvn test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full setup and pull request checklist.

## Community

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Release process](RELEASING.md)
- [Discussions](https://github.com/hmilyld/fullstack-starter/discussions) and [issues](https://github.com/hmilyld/fullstack-starter/issues)

## License

[MIT](LICENSE)
