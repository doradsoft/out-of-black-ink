from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path

import numpy as np
import pypdfium2 as pdfium
from PIL import Image, JpegImagePlugin  # noqa: F401 - registers JPEG PDF writer

Color = tuple[int, int, int]

DEFAULT_COLOR: Color = (0, 120, 170)


def convert_pdf(
    input_path: str | Path,
    output_path: str | Path,
    *,
    color: Color = DEFAULT_COLOR,
    scale: float = 2.8,
    threshold: int = 235,
    max_saturation: int = 38,
    pages: Iterable[int] | None = None,
) -> None:
    """Convert black/gray PDF content to colored content.

    Page numbers in `pages` are 1-based.
    """
    input_path = Path(input_path)
    output_path = Path(output_path)

    pdf = pdfium.PdfDocument(str(input_path))
    selected_pages = _normalize_pages(pages, len(pdf))

    rendered: list[Image.Image] = []
    try:
        for page_index in selected_pages:
            page = pdf[page_index]
            try:
                img = page.render(scale=scale).to_pil().convert("RGB")
                rendered.append(
                    recolor_image(
                        img,
                        color=color,
                        threshold=threshold,
                        max_saturation=max_saturation,
                    )
                )
            finally:
                page.close()
    finally:
        pdf.close()

    if not rendered:
        raise ValueError("No pages selected")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    rendered[0].save(
        output_path,
        "PDF",
        save_all=True,
        append_images=rendered[1:],
        resolution=200.0,
    )


def recolor_image(
    image: Image.Image,
    *,
    color: Color = DEFAULT_COLOR,
    threshold: int = 235,
    max_saturation: int = 38,
) -> Image.Image:
    arr = np.array(image.convert("RGB"), dtype=np.uint8)

    # Use int32. int16 overflows during luminance calculation on bright pixels.
    r = arr[..., 0].astype(np.int32)
    g = arr[..., 1].astype(np.int32)
    b = arr[..., 2].astype(np.int32)

    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    lum = (299 * r + 587 * g + 114 * b) // 1000
    saturation = maxc - minc

    mask = (lum < threshold) & (saturation < max_saturation)

    out = arr.copy()
    target = np.array(color, dtype=np.int32)

    # Keep anti-aliasing: darker source pixels get stronger target color,
    # light gray edges blend toward white.
    alpha = ((255 - lum).clip(0, 255) / 255.0)[..., None]
    colored = 255 - ((255 - target) * alpha)

    out[mask] = colored[mask].clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGB")


def _normalize_pages(pages: Iterable[int] | None, page_count: int) -> list[int]:
    if pages is None:
        return list(range(page_count))

    normalized = []
    for page in pages:
        if page < 1 or page > page_count:
            raise ValueError(f"Page {page} out of range 1..{page_count}")
        normalized.append(page - 1)
    return normalized
