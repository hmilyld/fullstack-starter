# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Runtime Chinese/English localization across the React, Vue and Svelte frontends, including document titles, PWA metadata and localized API errors from both backends.
- Mobile drag sorting for menu cards in all three frontends.
- Pagination regression coverage for user and role lists.

### Changed

- Aligned the three frontends on the shared design tokens, spacing, typography, dialogs, sheets, tabs, selects, dropdowns, switches, checkboxes, skeletons and empty states.
- Reworked menu management so the desktop tree, compact cards and row actions have the same structure and behavior in all three frontends.
- Matched the single-image Docker demo to the generated projects and aligned field paddings, table hover states and pagination placement.

### Fixed

- Svelte user and role lists now render pagination consistently with the other frontends.
- Svelte sidebar, profile reading width and menu tree indentation no longer drift from React and Vue.
- Vue compact menu groups keep a visible drop highlight while dragging.
- CORS accepts all three local frontend origins.
- Mobile menu drag tests now use stable data attributes instead of styling classes.

## [2.0.2] - 2026-11-13

### Added

- SvelteKit 3 SPA template alongside the existing React and Vue templates.
- Shared demo image packaging all three frontends and the Java backend.

### Changed

- Synced the three frontend design primitives, docs and runtime conventions.
- Served the generated Nginx configuration from Alpine's `http.d` layout.

### Fixed

- Refreshed the Svelte lockfile for `npm ci` on Node 22.

## [2.0.0] - 2026-11-12

### Added

- Initial public release of the generator and templates.
- React and Vue frontends with shared design system, authentication and RBAC.
- FastAPI and Spring Boot backends with a shared API contract.
- Dashboard, users, roles, permissions, menus, system settings, AI models, audit logs and data management.
- PWA support and single-image Docker deployment.

[Unreleased]: https://github.com/hmilyld/fullstack-starter/compare/v2.0.2...HEAD
[2.0.2]: https://github.com/hmilyld/fullstack-starter/compare/v2.0.0...v2.0.2
[2.0.0]: https://github.com/hmilyld/fullstack-starter/releases/tag/v2.0.0
