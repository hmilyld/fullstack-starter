# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chinese-language admin management system ("管理系统") with React and Vue frontends, Python FastAPI and Java Spring Boot backends. Four independent projects sit side-by-side (no monorepo tooling) — each has its own CLAUDE.md with detailed commands and conventions.

- **`frontend/`** — React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + shadcn/ui v4 + React Router 7. See `frontend/CLAUDE.md`.
- **`frontend-vue/`** — Vue 3 + TypeScript + Vite 6 + Tailwind CSS 4 + DaisyUI 5 + Vue Router 4. See `frontend-vue/CLAUDE.md`.
- **`backend/`** — Python 3.12+ + FastAPI + SQLAlchemy 2.0 async + SQLite (aiosqlite). See `backend/CLAUDE.md`.
- **`backend-java/`** — Java 21 + Spring Boot 3.2 + Sa-Token + JPA + SQLite. See `backend-java/CLAUDE.md`.

## Quick Reference

```bash
# React Frontend (run from frontend/)
pnpm dev              # Dev server on port 5173
pnpm build            # Type-check + production build
pnpm lint             # ESLint
pnpm format           # Prettier

# Vue Frontend (run from frontend-vue/)
pnpm dev              # Dev server on port 5174
pnpm build            # Type-check + production build
pnpm lint             # ESLint

# Backend (run from backend/)
uv sync                                    # Install dependencies
uv run uvicorn app.main:app --reload       # Dev server on port 8000
uv run ruff check .                        # Lint
uv run ruff format .                       # Format

# Backend-Java (run from backend-java/)
mvn clean package -DskipTests              # Build
mvn spring-boot:run                        # Dev server on port 8000
mvn spotless:check                         # Check code format
mvn spotless:apply                         # Auto-format code
```

No test framework is configured on either side. `pnpm build` and `ruff check` are the verification steps.

## Architecture

```
Browser → Vite dev server (:5173 React / :5174 Vue)
           └─ /api/* proxied to FastAPI/Spring Boot (:8000)
                └─ Route handler → JWT/Sa-Token auth + permission check
                     └─ CRUD → SQLAlchemy/JPA → SQLite (app.db)
                          └─ ApiResponse { code: 0, message: "success", data }
```

**Frontend routing:** Auth pages (`/login`, `/register`) are standalone. All management pages are children of `AdminLayout` wrapped in `ProtectedRoute`.

**Backend auth:** JWT Bearer tokens (Python) or Sa-Token (Java). The `admin` role (`role_id == "admin"`) is hardcoded to receive ALL permissions.

**API response format:** All endpoints return `{ code: 0, message: "success", data }`. `code === 0` indicates success.

## Key Conventions

- All UI text, API messages, seed data, and comments are in **Chinese**
- Frontend uses `@/` import alias → `src/` (only alias available)
- Backend Pydantic schemas use **camelCase** (`roleId`); SQLAlchemy models use **snake_case** (`role_id`)
- Frontend Prettier: no semicolons, double quotes, 2-space indent
- Backend Ruff: target py312, line-length 120
- shadcn/ui components are added via CLI (`npx shadcn@latest add <component>`), never written manually
- Icons: Lucide React (React frontend) / Lucide Vue (Vue frontend)

## Adding New Features

**React page:** Create page in `frontend/src/pages/<section>/`, add route in `router.tsx`, add sidebar item in `app-sidebar.tsx`, add breadcrumb in `header.tsx`, add API functions in `api.ts`.

**Vue page:** Create page in `frontend-vue/src/pages/<section>/`, add route in `router/index.ts`, add sidebar item in `AppSidebar.vue`, add breadcrumb in `AppHeader.vue`, add API functions in `api.ts`.

**Backend module:** Create `app/modules/<name>/` with `router.py`, `crud.py`, `schemas.py`, `models.py`. Mount in `app/main.py` with `app.include_router(router, prefix="/api")`.

## Seed Data

First startup creates: 5 users (password `123456`), 3 preset roles (`admin`, `user`, `pending_review`), 6 menu + 17 operation permissions. Preset roles cannot be deleted.
