# Examples

Convert every page using the default blue ink color:

```bash
out-of-black-ink input.pdf output.pdf
```

Use a brighter cyan:

```bash
out-of-black-ink input.pdf output.pdf --color "#0080b8"
```

Convert selected pages only:

```bash
out-of-black-ink input.pdf output.pdf --pages 1,3,5
```

Increase render quality for fine text or dense tables:

```bash
out-of-black-ink input.pdf output.pdf --scale 3.5
```

Tune gray detection for documents with faint scans:

```bash
out-of-black-ink input.pdf output.pdf --threshold 245 --max-saturation 45
```
