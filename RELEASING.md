# Releasing

The version in the root `package.json` is the single source of truth. Every
template, backend manifest and lock file is checked against it in CI.

## 1. Bump the version

```bash
# Edit the root package.json version, for example to 2.0.3, then:
pnpm run sync:version
pnpm run sync:version:check
```

`sync:version` updates:

- the three frontend `package.json` files and their lock roots
- the Python `pyproject.toml`, `uv.lock` and `APP_VERSION`
- the Java `pom.xml` and `APP_VERSION`

Do not edit those copies by hand.

## 2. Verify

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck:test
pnpm run build
pnpm test
pnpm run sync:permissions:catalog
pnpm run sync:design:check
pnpm run sync:version:check
```

CI runs the same checks on `main` and on every pull request.

## 3. Commit and tag

```bash
git add -A
git commit -m "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main
git push origin vX.Y.Z
```

The tag runs the CI workflow in order:

1. **Checks** — generator, three frontends and both backends.
2. **Build demo image** — verifies the tag matches `package.json` and publishes
   `ghcr.io/hmilyld/fullstack-starter:X.Y.Z`,
   `:vX.Y.Z` and `:latest`.
3. **Release** — creates the GitHub Release only after the image push succeeds.

On `main` pushes the same workflow runs the checks and publishes `:edge`; it
does not create a release.

## npm

The CLI is packaged as `@hmilyld/create-fullstack-app`. The first public npm
release is still pending; when it is published, run it from a clean checkout:

```bash
npm login
pnpm publish --access public
```

`prepublishOnly` runs the build, the generated-project tests and the version
check automatically. The package is scoped, so `publishConfig.access` is
already set to `public`. Use npm's two-factor authentication or a granular
automation token; never commit a token.
