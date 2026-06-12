# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
uv sync                              # Install dependencies
uv sync --extra dev                  # Install dev dependencies (ruff)
uv run uvicorn app.main:app --reload # Start dev server (port 8000)
uv run ruff check .                  # Lint (only verification — no tests)
uv run ruff format .                 # Format code
```

No test framework exists. Linting is the only automated verification.

## Tech Stack

Python 3.12+ async backend using FastAPI, SQLAlchemy 2.0 (async mode) with aiosqlite (SQLite), PyJWT + bcrypt for authentication, and pydantic-settings for config. Package manager is **uv**, not pip. Linter/formatter is **ruff**.

## Architecture

**Entry point:** `app.main:app` — FastAPI instance with lifespan that auto-creates tables and seeds data on startup.

**Request flow:** HTTP → route handler → `get_db()` (async SQLAlchemy session) + optional `require_permission(...)` (JWT auth) → CRUD layer → `ApiResponse` response.

**Authentication:** JWT Bearer tokens. Token `sub` claim holds user ID. Secret configured via `JWT_SECRET_KEY` env var.

**Permission system:** Two-tier — `menu` permissions (page access) and `operation` permissions (CRUD actions). The `admin` role (`role_id == "admin"`) is hardcoded to receive ALL permissions in `app/deps.py:59`. Preset roles (`admin`, `user`, `pending_review`) cannot be deleted.

**Response format:** All endpoints return `ApiResponse` — `{ code: 0, message: "success", data }`. `code === 0` is success.

## Directory Layout

```
app/
  main.py           # FastAPI app, lifespan, CORS, router mounting
  config.py         # pydantic-settings Settings (reads .env)
  database.py       # SQLAlchemy async engine + session factory + Base
  deps.py           # Auth dependencies (get_current_user, require_permission)
  core/
    models.py       # SQLAlchemy models (User, Role, Permission, SystemConfig)
    schemas.py      # Pydantic request/response schemas
    security.py     # JWT encode/decode + bcrypt hash/verify
    seed.py         # Auto-seeds DB on first run
    crud/           # Database operations (users, roles, permissions)
    routes/         # API routers (auth, users, roles, permissions)
  modules/
    system/         # System config module (router, crud, schemas, models)
```

## Key Conventions

- **API prefix:** All routes mounted under `/api` in `app/main.py`
- **CORS:** Configured for `http://localhost:5173` (frontend dev server)
- **UI language:** All API messages, seed data, and comments are in Chinese
- **Pydantic field naming:** Request/response schemas use camelCase (`roleId`, `pageSize`); SQLAlchemy models use snake_case (`role_id`). Mapping happens in the CRUD/route layer.
- **Ruff config:** `target-version = "py312"`, `line-length = 120`, select `E,F,I,N,W,UP`
- **Seed data:** Created on first startup — 5 users (password `123456`), 3 preset roles, 5 menu + 10 operation permissions

## Adding New Modules

1. Create `app/modules/<name>/` with `router.py`, `crud.py`, `schemas.py`, `models.py`
2. Define router with `APIRouter(prefix="/<name>", tags=[...])`
3. Include in `app/main.py`: `app.include_router(<router>, prefix="/api")`
4. Use `require_permission("<permission_code>")` for protected endpoints

## Environment Variables

Configured via `.env` (copy from `.env.example`): `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS`.
