# out-of-black-ink

[![CI](https://github.com/doradsoft/out-of-black-ink/actions/workflows/ci.yml/badge.svg)](https://github.com/doradsoft/out-of-black-ink/actions/workflows/ci.yml)
[![Pages](https://github.com/doradsoft/out-of-black-ink/actions/workflows/pages.yml/badge.svg)](https://github.com/doradsoft/out-of-black-ink/actions/workflows/pages.yml)
[![Cloudflare Worker](https://github.com/doradsoft/out-of-black-ink/actions/workflows/cloudflare-worker.yml/badge.svg)](https://github.com/doradsoft/out-of-black-ink/actions/workflows/cloudflare-worker.yml)
[![Publish](https://github.com/doradsoft/out-of-black-ink/actions/workflows/publish.yml/badge.svg)](https://github.com/doradsoft/out-of-black-ink/actions/workflows/publish.yml)
[![Web app](https://img.shields.io/badge/web_app-open-0078aa)](https://doradsoft.github.io/out-of-black-ink/)
[![PyPI](https://img.shields.io/pypi/v/out-of-black-ink.svg)](https://pypi.org/project/out-of-black-ink/)
[![Python versions](https://img.shields.io/pypi/pyversions/out-of-black-ink.svg)](https://pypi.org/project/out-of-black-ink/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Convert black/gray PDF content into colored ink-friendly output.
Useful when your black cartridge is empty but color ink still works.

## Repository Layout

- [packages/python/](packages/python/) contains the Python package, tests, and examples.
- [packages/typescript/](packages/typescript/) contains the TypeScript npm package used by browser apps.
- [apps/web/](apps/web/) contains the GitHub Pages browser app.
- [apps/cloudflare-worker/](apps/cloudflare-worker/) contains the ChatGPT MCP endpoint deployed to Cloudflare Workers.

## What it does

- Renders PDF pages with PDFium
- Detects near-neutral black/gray pixels: text, lines, tables, barcodes
- Recolors them to a print-friendly color
- Keeps existing colored content mostly unchanged
- Saves a new PDF

## Install

```bash
pip install out-of-black-ink
```

For local development:

```bash
git clone https://github.com/doradsoft/out-of-black-ink.git
cd out-of-black-ink
python -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
```

On Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -e ".[dev]"
```

## Usage

```bash
out-of-black-ink input.pdf output.pdf
```

Custom color:

```bash
out-of-black-ink input.pdf output.pdf --color "#0080b8"
```

Only first page:

```bash
out-of-black-ink input.pdf output.pdf --pages 1
```

Higher quality render:

```bash
out-of-black-ink input.pdf output.pdf --scale 3.5
```

Tune gray detection for faint scans:

```bash
out-of-black-ink input.pdf output.pdf --threshold 245 --max-saturation 45
```

## Library usage

```python
from out_of_black_ink import convert_pdf

convert_pdf("input.pdf", "output.pdf")
```

## Development

Run the local quality checks:

```bash
python -m ruff check .
python -m pytest
python -m build
npm ci
npm run check:ts
npm run check:web
npm run check:worker
npm run test:worker
```

The CI pipeline runs these checks on Python 3.9 through 3.14.
Node.js 24 is used for the npm workspaces.
See [docs/DEPENDENCY_POLICY.md](docs/DEPENDENCY_POLICY.md) for version pinning rules.

More command examples live in [packages/python/examples/](packages/python/examples/).

## Browser App

There is also a client-side web version in [apps/web/](apps/web/). It runs entirely in
the browser with PDF.js and jsPDF, so PDFs do not need to be uploaded to a server.

Open it here: [doradsoft.github.io/out-of-black-ink](https://doradsoft.github.io/out-of-black-ink/).

The browser app is intentionally separate from the Python package. It uses the TypeScript
package in [packages/typescript/](packages/typescript/) and does not import or run Python.

## Release

Publishing is handled by GitHub Actions:

- Pull requests and pushes run tests, linting, and package builds.
- Publishing a GitHub release publishes the package to PyPI.
- Publishing a GitHub release can also publish the TypeScript package to npm.
- The Publish workflow can also be run manually against TestPyPI.

See [docs/PUBLISHING.md](docs/PUBLISHING.md) for PyPI and npm token setup.

## ChatGPT App

This project includes a ChatGPT App MCP endpoint that opens the client-side converter.
See [docs/CHATGPT_APP.md](docs/CHATGPT_APP.md) for the publishing plan.

The Cloudflare Worker lives in [apps/cloudflare-worker/](apps/cloudflare-worker/).
It deploys the MCP endpoint at
[out-of-black-ink-mcp.doradsoft.workers.dev](https://out-of-black-ink-mcp.doradsoft.workers.dev/).
See [docs/CLOUDFLARE_WORKER.md](docs/CLOUDFLARE_WORKER.md) for the budget controls and deploy notes.
See [docs/CHATGPT_VALIDATION.md](docs/CHATGPT_VALIDATION.md) for Developer Mode validation.

## Notes

This tool rasterizes the PDF. The output PDF is image-based, not selectable/searchable text.

## License

MIT. See [docs/LICENSE_COMPLIANCE.md](docs/LICENSE_COMPLIANCE.md) for dependency license notes.
