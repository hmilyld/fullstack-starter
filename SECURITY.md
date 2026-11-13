# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 2.x     | Yes       |
| < 2.0   | No        |

Security fixes are released on the latest 2.x version.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report it privately through GitHub Security Advisories:

<https://github.com/hmilyld/fullstack-starter/security/advisories/new>

Please include:

- the affected component: generator CLI, a template, generated project defaults, the demo image, or CI
- the version or tag, and the frontend/backend combination when relevant
- your operating system and runtime versions (Node, Python, Java, Docker)
- reproduction steps or a proof of concept
- the impact you believe it has

We aim to acknowledge a report within 3 business days, triage it within 7
business days, and keep you informed until a fix is available. Please give us
time to publish a fix before disclosing the issue publicly.

## Scope

In scope:

- `src/` (the generator CLI)
- `templates/` and the projects they generate
- `.github/demo` and the published demo image
- release and CI workflows

Out of scope:

- vulnerabilities in third-party dependencies (please report those upstream)
- issues that only appear after the generated project has been modified
- findings that rely on the intentional local demo defaults described below

## Known demo defaults

Generated projects and the demo image seed a local administrator
`admin / 123456` and sample users. This is intentional so a freshly generated
project can be opened immediately, and it is not a vulnerability by itself.

Before exposing a generated project to a network, change every seeded password,
set a strong `JWT_SECRET_KEY` for the Python backend, and review the generated
`README.md` deployment notes.

Never include secrets, tokens, passwords, or personal data in issues, pull
requests, or advisories.
