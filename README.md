# out-of-black-ink

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
pip install -e .
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

## Library usage

```python
from out_of_black_ink import convert_pdf

convert_pdf("input.pdf", "output.pdf")
```

## Notes

This tool rasterizes the PDF. The output PDF is image-based, not selectable/searchable text.

## License

MIT
