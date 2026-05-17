# Contributing

Thanks for helping improve `out-of-black-ink`.

## Development Setup

```bash
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

## Quality Checks

Run the same checks used by CI:

```bash
python -m ruff check .
python -m pytest
python -m build
```

## Testing Notes

Keep image tests small and deterministic. Prefer asserting exact pixel output for tiny in-memory
images over checking generated PDF bytes, which can vary across dependency versions.

## Repository Layout

- `packages/python/`: Python package source, tests, and examples.
- `apps/web/`: TypeScript web app deployed to GitHub Pages.
- `apps/cloudflare-worker/`: TypeScript Cloudflare Worker used as the ChatGPT MCP endpoint.
