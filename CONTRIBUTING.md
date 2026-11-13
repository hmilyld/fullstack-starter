# Contributing

Thanks for taking the time to improve Fullstack Forge. This repository is both
a generator and the home of five runnable templates, so a small change can
affect every generated project. The notes below are here to keep that safe.

English is the default language for repository documentation. Chinese docs live
in [`docs/zh/`](docs/zh/) and are kept in sync; when you change one language,
please update the other in the same pull request.

## Before you start

- Open an issue (or a discussion) before a large feature, a template
  restructure, or anything that changes the public API contract.
- The API contract lives in [`docs/contract/api.md`](docs/contract/api.md). It
  is the source of truth for both backends: change the contract first, then
  update `templates/backend-python` and `templates/backend-java`, and keep both
  contract test suites passing.
- Do not include secrets, local databases, or build artifacts in a commit.

## Requirements

| Tool    | Version                    |
| ------- | -------------------------- |
| Node.js | 22+                        |
| pnpm    | 11                         |
| Python  | 3.12+                      |
| uv      | latest                     |
| Java    | 21                         |
| Maven   | 3.9+                       |
| Docker  | optional, for image checks |

The frontend templates use npm and commit their own `package-lock.json`; the
repository root uses pnpm.

## Repository layout

```text
src/                  generator CLI (prompts, template copy, generated files)
scripts/              maintenance scripts and CI helpers
templates/            the exact files users receive
  base/               shared files
  frontend-react/     React 19 template
  frontend-vue/       Vue 3 template
  frontend-svelte/    Svelte 5 + SvelteKit template
  backend-python/     FastAPI template
  backend-java/       Spring Boot template
docs/                 contract, screenshots, zh/en guides
.github/              workflows, issue/PR templates, demo image context
```

Template directories are the product. Editing `templates/<name>/` is how you
change what users get; there is no second copy to synchronise.

## Development setup

```bash
pnpm install
pnpm run build
pnpm run dev
```

`pnpm run dev` runs the CLI from source. `pnpm run build` compiles TypeScript to
`dist/`.

## Changing templates

- Keep each stack idiomatic; do not unify the internal structure of the three
  frontends or the two backends.
- Read `templates/frontend-react/DESIGN.md` before changing any UI. The Vue and
  Svelte templates share the same visual rules.
- Permission and built-in menu data live in code catalogs:
  `templates/backend-python/app/catalogs/` and
  `templates/backend-java/src/main/java/com/hmilyld/fullstack/catalog/`.
  Keeping them identical is enforced by
  `pnpm run sync:permissions:check`.
- Database changes go through Alembic (Python) or Flyway (Java). Never edit a
  database by hand, and never add permission rows to a migration.
- If you change a template, generate a project and verify it before opening a
  pull request.

## Validation

Run the checks for the parts you touched. Before opening a pull request, run at
least the root checks and the checks for every template you changed.

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

# Python backend
cd templates/backend-python
uv run ruff check .
uv run pytest -q

# Java backend
cd templates/backend-java
mvn spotless:apply
mvn test

# Frontends (run only the ones you changed)
cd templates/frontend-react && npm ci && npm run lint && npm test && npm run build
cd templates/frontend-vue && npm ci && npm run lint && npm test && npm run build
cd templates/frontend-svelte && npm ci && npm run lint && npm test && npm run check && npm run build
```

The Svelte browser-mode tests need Chromium once:
`npx playwright install chromium`.

For a template change, also generate a project and smoke-test it:

```bash
pnpm run dev
cd <generated project>/frontend && npm install && npm run build
cd <generated project>/backend && <start the backend>
docker build -t fullstack-smoke .
# Python images require JWT_SECRET_KEY; Java ignores the variable.
docker run --rm -p 5173:5173 \
  -e JWT_SECRET_KEY="$(openssl rand -base64 48)" fullstack-smoke
```

## Commits and pull requests

- Use Conventional Commits, for example
  `fix(frontend-svelte): keep the lock file in sync`.
- Keep a pull request focused on one concern.
- Fill in the pull request template. UI changes need a screenshot or recording.
- Do not force-push a shared branch after review has started.
- The release process is documented in [RELEASING.md](RELEASING.md).

## Language and documentation

- Root `README.md` and `docs/en/` are the English source of truth.
- `docs/zh/` is the Chinese translation and should describe the same behaviour.
- API changes must be reflected in `docs/contract/api.md`.
- The online documentation site lives in the sibling
  [`fullstack-starter-docs`](https://github.com/hmilyld/fullstack-starter-docs)
  repository. Mention related site changes in your pull request.

## Code of conduct

By participating you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behaviour to
<hmilyld@gmail.com>.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE). This project does not require a CLA.
