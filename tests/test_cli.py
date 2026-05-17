from __future__ import annotations

import argparse

import pytest

from out_of_black_ink.cli import _parse_hex_color, _parse_pages, _to_hex


def test_parse_pages_returns_none_for_missing_value() -> None:
    assert _parse_pages(None) is None
    assert _parse_pages("") is None


def test_parse_pages_accepts_comma_separated_page_numbers() -> None:
    assert _parse_pages("1, 3,5") == [1, 3, 5]


def test_parse_hex_color_accepts_hash_prefixed_color() -> None:
    assert _parse_hex_color("#0080b8") == (0, 128, 184)


def test_parse_hex_color_accepts_plain_color() -> None:
    assert _parse_hex_color("0080b8") == (0, 128, 184)


@pytest.mark.parametrize("value", ["#12345", "#xyzxyz"])
def test_parse_hex_color_rejects_invalid_color(value: str) -> None:
    with pytest.raises(argparse.ArgumentTypeError, match="#RRGGBB"):
        _parse_hex_color(value)


def test_to_hex_formats_lowercase_color() -> None:
    assert _to_hex((0, 128, 184)) == "#0080b8"
