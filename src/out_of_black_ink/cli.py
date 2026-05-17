from __future__ import annotations

import argparse

from .core import DEFAULT_COLOR, convert_pdf


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="out-of-black-ink",
        description="Convert black/gray PDF content into colored ink-friendly output.",
    )
    parser.add_argument("input", help="Input PDF path")
    parser.add_argument("output", help="Output PDF path")
    parser.add_argument("--color", default=_to_hex(DEFAULT_COLOR), help="Target color, e.g. #0080aa")
    parser.add_argument("--scale", type=float, default=2.8, help="PDF render scale")
    parser.add_argument("--threshold", type=int, default=235, help="Brightness threshold for black/gray detection")
    parser.add_argument("--max-saturation", type=int, default=38, help="Max saturation for neutral gray detection")
    parser.add_argument("--pages", help="Comma-separated 1-based pages, e.g. 1,3,5")

    args = parser.parse_args()

    convert_pdf(
        args.input,
        args.output,
        color=_parse_hex_color(args.color),
        scale=args.scale,
        threshold=args.threshold,
        max_saturation=args.max_saturation,
        pages=_parse_pages(args.pages),
    )


def _parse_pages(value: str | None) -> list[int] | None:
    if not value:
        return None
    return [int(part.strip()) for part in value.split(",") if part.strip()]


def _parse_hex_color(value: str) -> tuple[int, int, int]:
    value = value.strip().lstrip("#")
    if len(value) != 6:
        raise argparse.ArgumentTypeError("Color must be in #RRGGBB format")
    try:
        return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Color must be in #RRGGBB format") from exc


def _to_hex(color: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % color


if __name__ == "__main__":
    main()
