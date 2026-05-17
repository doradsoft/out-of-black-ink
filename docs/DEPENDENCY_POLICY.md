# Dependency Policy

This repository uses different dependency rules for deployable apps and published libraries.

## JavaScript and TypeScript

The npm workspaces are reproducible by default:

- The root `package-lock.json` is the only npm lockfile.
- CI and deploy workflows install with `npm ci`.
- Direct npm dependencies in workspace `package.json` files are exact versions.
- `.npmrc` sets `save-exact=true` so new npm dependencies are added without `^` or `~`.
- The root `package.json` records the expected Node and npm major versions.
- `.nvmrc` and `.node-version` both point to Node 24 for local tool managers.

Use the root workspace when changing npm dependencies:

```bash
npm install package-name@1.2.3 --workspace workspace-name
npm run check
```

Do not add per-app lockfiles under `apps/*` or `packages/*`.

## Python

The Python package is published for users to install into their own environments, so direct
runtime dependencies are not exact-pinned in `pyproject.toml`. They use lower and upper bounds
instead:

- Lower bounds document the oldest supported versions.
- Upper bounds avoid untested major releases.
- The package remains compatible with normal Python dependency resolution.

Development-only Python tooling and the build backend are also bounded by major version.

## GitHub Actions

Workflows use explicit Python and Node versions. GitHub Actions are pinned to commit SHAs with
the human-readable major tag left in a comment, such as `# v4`. This prevents a moved tag from
changing the code that runs with repository, PyPI, npm, or Cloudflare permissions.

Dependabot is configured to open weekly maintenance PRs for npm, Python, and GitHub Actions.

## Updating Dependencies

For npm updates, choose exact versions and commit the resulting `package-lock.json`:

```bash
npm install vite@7.3.3 --workspace @doradsoft/out-of-black-ink-web
npm ci
npm run check
```

For Python dependency range changes, run:

```bash
python -m pip install -e ".[dev]"
python -m ruff check .
python -m pytest
python -m build
```

Before publishing, also review [LICENSE_COMPLIANCE.md](LICENSE_COMPLIANCE.md) when adding or
replacing dependencies.
