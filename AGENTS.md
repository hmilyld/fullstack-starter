# AGENTS.md

## Two independent projects, side-by-side

No monorepo tooling, no shared `node_modules`, no workspace config. `frontend/` and `backend/` each have their own package manager, lockfile, and CLAUDE.md/AGENTS.md. Always run commands from the correct subdirectory.

## Verification commands

After making changes, run verification in the directory you changed:

```bash
# Frontend
cd frontend && pnpm build          # type-check + production build (the gate)
cd frontend && pnpm lint           # eslint

# Backend
cd backend && uv run ruff check .  # lint
```

No test framework exists on either side. `pnpm build` and `ruff check` are the only gates.

## Dev lifecycle

```bash
./dev.sh start    # starts backend (:8000) + frontend (:5173), auto-creates .env with JWT key
./dev.sh stop     # stops both, cleans up PIDs and stray processes
./dev.sh restart
./dev.sh status
./dev.sh logs     # tail backend.log / frontend.log
```

`dev.sh` auto-generates `JWT_SECRET_KEY` and writes `backend/.env` if missing. If you need a fresh DB, delete `backend/app.db` and restart.

## API contract

All endpoints return `{ code: 0, message: "success", data }`. `code === 0` is success. This is the same format on both mock (frontend) and real (backend) layers.

## Field naming split

Pydantic schemas (request/response): **camelCase** (`roleId`, `pageSize`).
SQLAlchemy models: **snake_case** (`role_id`).
Mapping happens in the CRUD/route layer — don't leak snake_case into API responses or camelCase into DB models.

## All user-facing text is Chinese

Labels, seed data, error messages, API messages, comments. Never add English UI strings.

## Backend .env

`dev.sh` creates it automatically. Manual setup:

```
DATABASE_URL=sqlite+aiosqlite:///./app.db
JWT_SECRET_KEY=<any-random-string>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://localhost:5173"]
```

## Docker deployment

Multi-stage Dockerfile: frontend builds in Node, backend runs in Python. Nginx on port 80 serves static files and reverse-proxies `/api/*` to uvicorn on port 8000.

```bash
./build.sh                          # builds Docker image (default: fullstack-admin:latest)
JWT_SECRET_KEY=secret docker compose up -d   # requires JWT_SECRET_KEY
```

## Database

SQLite (`app.db`). Auto-created and seeded on backend startup. Seed: 5 users (password `123456`), 3 preset roles (`admin`, `user`, `pending_review`), menu + operation permissions. Preset roles cannot be deleted.

## Adding features

**Frontend page:** `frontend/src/pages/<section>/` → route in `router.tsx` → sidebar in `app-sidebar.tsx` → breadcrumb in `header.tsx` → API in `api.ts`.

**Backend module:** `backend/app/modules/<name>/` (router, crud, schemas, models) → mount in `app/main.py` with `app.include_router(router, prefix="/api")`.

## See also

- `frontend/AGENTS.md` — frontend-specific conventions (shadcn, TypeScript strictness, CRUD patterns)
- `backend/AGENTS.md` — backend-specific conventions (uv, Ruff, module structure)
- `frontend/CLAUDE.md` and `backend/CLAUDE.md` — detailed reference for each side
