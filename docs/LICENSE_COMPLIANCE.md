# License Compliance

The repository is MIT licensed.

## Project Code

- Python package: MIT, see `LICENSE`.
- TypeScript package: MIT, see `packages/typescript/LICENSE`.
- Web app: MIT, see `apps/web/LICENSE`.
- Cloudflare Worker MCP endpoint: covered by the repository MIT license.

## Direct Runtime Dependencies

The direct dependencies are compatible with an MIT-licensed project:

| Area | Dependency | License |
| --- | --- | --- |
| Python | `numpy` | BSD-style |
| Python | `Pillow` | HPND-style |
| Python | `pypdfium2` | BSD-3-Clause / Apache-2.0 plus bundled dependency notices |
| TypeScript | none | no direct runtime dependencies |
| Web | `jspdf` | MIT |
| Web | `pdfjs-dist` | Apache-2.0 |

Apache-2.0 is compatible with MIT distribution. Keep Apache-2.0 copyright, license, and
NOTICE-style attribution files when redistributing bundled artifacts.

## Development Dependencies

The configured development tools are license-compatible:

- `build`
- `pytest`
- `ruff`
- `hatchling`
- `@eslint/js`
- `eslint`
- `globals`
- `prettier`
- `vite`
- `wrangler`

## Practical Rules

- Do not remove `LICENSE`.
- Keep `packages/typescript/LICENSE` in the npm package.
- Keep `apps/web/LICENSE` and `apps/web/THIRD_PARTY_NOTICES.md` with the deployed web app.
- Before a public npm/PyPI release, review generated artifacts for bundled third-party license
  files and preserve them.
- If new dependencies are added, check their licenses before release.
