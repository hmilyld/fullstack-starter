# Java Backend (backend-java)

Spring Boot 3.2 + Sa-Token + JPA + SQLite

## Quick Reference

```bash
# Build & Run
mvn clean package -DskipTests              # Build
mvn spring-boot:run                        # Dev server on port 8000
mvn clean package -DskipTests && java -jar target/fullstack-backend-1.0.0.jar

# Code Quality
mvn spotless:check                         # Check code format
mvn spotless:apply                         # Auto-format code (Google Java Format)
```

## Project Structure

```
backend-java/
├── src/main/java/com/hmilyld/fullstack/
│   ├── config/           # Configuration classes
│   │   ├── SaTokenConfig.java        # Sa-Token interceptor config
│   │   ├── BearerTokenFilter.java    # Auth header conversion filter
│   │   └── CorsConfig.java           # CORS configuration
│   ├── controller/       # REST controllers
│   ├── service/          # Business logic
│   ├── repository/       # JPA repositories
│   ├── entity/           # JPA entities
│   ├── dto/              # Request/Response DTOs
│   ├── security/         # StpInterface implementation
│   └── common/           # ApiResponse, GlobalExceptionHandler
├── src/main/resources/
│   └── application.yml   # Configuration
├── pom.xml               # Maven dependencies
└── .editorconfig         # Editor configuration
```

## Architecture

```
Browser → Vite dev server (:5173 React / :5174 Vue)
           └─ /api/* proxied to Spring Boot (:8000)
                └─ BearerTokenFilter → Sa-Token Auth Check
                     └─ Controller → Service → Repository
                          └─ JPA → SQLite (data/app.db)
                               └─ ApiResponse { code: 0, message: "success", data }
```

## Key Conventions

- **Language:** All UI text, API messages, seed data, and comments are in **Chinese**
- **Code Style:** Google Java Format (enforced by Spotless)
- **Indent:** 4 spaces (Google style)
- **Auth:** Sa-Token with `satoken` header (converted from `Authorization: Bearer` by `BearerTokenFilter`)
- **API Response:** `{ code: 0, message: "success", data }` for success, `{ code: -1, message: "error" }` for failure
- **DTO Naming:** camelCase (e.g., `roleId`, `passwordHash`)
- **Entity Naming:** snake_case columns via JPA `@Column`
- **No Semicolons in Frontend:** Prettier configured without semicolons

## Authentication Flow

1. Frontend sends `Authorization: Bearer <token>` header
2. `BearerTokenFilter` extracts token and sets `satoken` header
3. `SaTokenConfig` interceptor reads token from `satoken` header
4. `@SaCheckPermission` annotations verify permissions via `StpInterfaceImpl`

## Adding New Features

**New endpoint:** Create controller method with `@SaCheckPermission` annotation, add service logic, create/update DTOs.

**New entity:** Create entity class with JPA annotations, create repository interface, add Flyway migration if needed.

## Code Formatting

This project uses **Spotless** with **Google Java Format** to ensure consistent code style.

```bash
# Check if code follows formatting rules
mvn spotless:check

# Auto-format all code
mvn spotless:apply
```

The formatter will:
- Apply Google Java Format style (4-space indent, standard Java conventions)
- Remove unused imports
- Ensure consistent line breaks and spacing

All code should be formatted before committing. Run `mvn spotless:apply` to auto-fix.
