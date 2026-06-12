# AGENTS.md

## Commands

```bash
uv sync                     # Install dependencies
uv run uvicorn app.main:app --reload   # Start dev server (port 8000)
uv run ruff check .         # Lint
uv run ruff format .        # Format
```

No test framework exists. Lint is the only verification step.

## Package manager

**uv** — not pip. Lockfile: `uv.lock`. Dev deps: `uv sync --extra dev`.

## Architecture

- **Entry point**: `app.main:app` (FastAPI)
- **Database**: SQLite via aiosqlite (`app.db` in backend root). Tables auto-created on startup.
- **Auth**: JWT Bearer tokens. Secret from `JWT_SECRET_KEY` env var.
- **Permissions**: Two-tier — `menu` (page access) and `operation` (CRUD). Admin role (`role_id == "admin"`) hardcoded to receive ALL permissions in `app/deps.py:59`.
- **API responses**: All endpoints return `ApiResponse` — `{ code: 0, message: "success", data }`. `code === 0` is success.

## Directory layout

```
app/
  main.py           # FastAPI app, lifespan, router mounting
  config.py         # pydantic-settings (reads .env)
  database.py       # SQLAlchemy async engine + session
  deps.py           # Auth dependencies (get_current_user, require_permission)
  core/
    models.py       # SQLAlchemy models (User, Role, Permission, SystemConfig)
    schemas.py      # Pydantic request/response schemas
    security.py     # JWT + bcrypt helpers
    seed.py         # Auto-seeds DB on first run
    crud/           # Database operations (users, roles, permissions)
    routes/         # API routers (auth, users, roles, permissions)
  modules/
    system/         # System config module (router, crud, schemas)
```

## Seed data

Database is seeded automatically on first startup (`app/core/seed.py`):
- Default users: `admin`/`123456`, `zhangsan`/`123456`, `lisi`/`123456`, etc.
- Preset roles: `admin`, `user`, `pending_review` (cannot delete)
- Permissions: 5 menu + 10 operation codes

## Key conventions

- **API prefix**: All routes mounted under `/api` (set in `app/main.py`)
- **CORS**: Configured for `http://localhost:5173` (frontend dev server)
- **UI language**: All API messages and seed data in Chinese
- **Pydantic field naming**: Request/response schemas use camelCase (`roleId`, `pageSize`), SQLAlchemy models use snake_case (`role_id`). Mapping in CRUD layer.
- **Ruff config**: `target-version = "py312"`, `line-length = 120`, select `E,F,I,N,W,UP`

## Adding new modules

1. Create `app/modules/<name>/` with `router.py`, `crud.py`, `schemas.py`, `models.py`
2. Define router with `APIRouter(prefix="/<name>", tags=[...])`
3. Include in `app/main.py`: `app.include_router(<router>, prefix="/api")`
4. Use `require_permission("<permission_code")` for protected endpoints
