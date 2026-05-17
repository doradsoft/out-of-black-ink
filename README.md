# out-of-black-ink

[![CI](https://github.com/doradsoft/out-of-black-ink/actions/workflows/ci.yml/badge.svg)](https://github.com/doradsoft/out-of-black-ink/actions/workflows/ci.yml)
[![Publish](https://github.com/doradsoft/out-of-black-ink/actions/workflows/publish.yml/badge.svg)](https://github.com/doradsoft/out-of-black-ink/actions/workflows/publish.yml)
[![PyPI](https://img.shields.io/pypi/v/out-of-black-ink.svg)](https://pypi.org/project/out-of-black-ink/)
[![Python versions](https://img.shields.io/pypi/pyversions/out-of-black-ink.svg)](https://pypi.org/project/out-of-black-ink/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Convert black/gray PDF content into colored ink-friendly output.
Useful when your black cartridge is empty but color ink still works.

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
```

The CI pipeline runs these checks on Python 3.9 through 3.14.

More command examples live in [examples/](examples/).

## Release

Publishing is handled by GitHub Actions:

- Pull requests and pushes run tests, linting, and package builds.
- Publishing a GitHub release publishes the package to PyPI.
- The Publish workflow can also be run manually against TestPyPI.

PyPI publishing is designed for trusted publishing. Configure the `pypi` and `testpypi`
environments in GitHub before the first release.

## ChatGPT App

This project can become a ChatGPT App by wrapping the converter in a hosted Apps SDK MCP
server. See [docs/CHATGPT_APP.md](docs/CHATGPT_APP.md) for the publishing plan.

## Notes

This tool rasterizes the PDF. The output PDF is image-based, not selectable/searchable text.

## License

MIT
