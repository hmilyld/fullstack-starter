# Repository Guidelines

## Project Overview

**create-fullstack-app** is a scaffolding tool that generates fullstack admin panel projects. Users select a frontend framework (React/Vue) and a backend framework (Python/Java), and the tool generates a complete project with JWT authentication (login/register/logout), user/role/permission management, system settings, AI model management, audit logging, a dashboard, and Docker deployment.

## Project Structure

```
fullstack-starter/
├── src/
│   ├── index.ts              # CLI entry — interactive prompts
│   └── generator.ts          # Core generator — copies templates + generates config files
└── templates/
    ├── base/                 # Shared files (.gitignore)
    ├── frontend-react/       # React (Vite + TS + Tailwind CSS)
    ├── frontend-vue/         # Vue (Vite + TS + Tailwind CSS + DaisyUI)
    ├── backend-python/       # Python (FastAPI + SQLAlchemy + SQLite)
    └── backend-java/         # Java (Spring Boot + JPA + H2)
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

## Template Directory Conventions

Each stack follows its own idiomatic organization (do NOT unify them):

- **backend-python/** — domain modules: `app/core/` (infrastructure: config, database, security, deps, audit middleware, seed, permission catalog) + one package per business domain (`auth/`, `user/`, `role/`, `permission/`, `system/`, `ai_model/`, `audit/`, `dashboard/`, `public/`), each containing `models.py` / `schemas.py` / `crud.py` / `router.py` as needed. `ApiResponse` / `PaginatedData` live in `app/core/schemas.py`.
- **backend-java/** — package-by-layer: `controller/`, `service/`, `repository/`, `entity/`, `dto/`, plus `common/`, `config/`, `security/`.
- **frontend-react/ & frontend-vue/** — feature-based: pages under `pages/settings/<Domain>/index.tsx`, API calls split by domain under `api/` (`client.ts` + `auth.ts`, `user.ts`, ...), types split by domain under `types/` (`common.ts` + per-domain). Shared technical code stays in `components/` (`shared/`, `ui/`), `lib/`, and (Vue) `stores/` + `composables/`. No duplicate type definitions across files.

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
3. When adding/changing a feature, keep documentation in sync:
   - Feature list, module table and API tables in root `README.md`
   - `generateReadme()` in `src/generator.ts` (the generated project's README)
4. Test: `npm run dev` → select option → verify generated project builds

## Testing

No automated test framework. Manual verification:

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
