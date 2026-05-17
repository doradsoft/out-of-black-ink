from __future__ import annotations

import pytest
from out_of_black_ink.core import DEFAULT_COLOR, _normalize_pages, recolor_image
from PIL import Image


def _pixels(image: Image.Image) -> list[tuple[int, int, int]]:
    return [image.getpixel((x, y)) for y in range(image.height) for x in range(image.width)]


def test_recolor_image_recolors_neutral_dark_pixels() -> None:
    image = Image.new("RGB", (3, 1))
    image.putdata(
        [
            (0, 0, 0),
            (128, 128, 128),
            (255, 0, 0),
        ]
    )

    result = recolor_image(image, color=DEFAULT_COLOR)

    assert _pixels(result) == [
        DEFAULT_COLOR,
        (128, 187, 212),
        (255, 0, 0),
    ]


def test_recolor_image_leaves_light_neutral_pixels_alone() -> None:
    image = Image.new("RGB", (2, 1))
    image.putdata([(240, 240, 240), (255, 255, 255)])

    result = recolor_image(image, color=(0, 120, 170), threshold=235)

    assert _pixels(result) == [(240, 240, 240), (255, 255, 255)]


def test_recolor_image_leaves_saturated_pixels_alone() -> None:
    image = Image.new("RGB", (2, 1))
    image.putdata([(20, 120, 20), (40, 40, 180)])

    result = recolor_image(image, color=(0, 120, 170), max_saturation=38)

    assert _pixels(result) == [(20, 120, 20), (40, 40, 180)]


def test_normalize_pages_defaults_to_all_pages() -> None:
    assert _normalize_pages(None, 3) == [0, 1, 2]


def test_normalize_pages_converts_one_based_page_numbers() -> None:
    assert _normalize_pages([1, 3], 3) == [0, 2]


@pytest.mark.parametrize("pages", [[0], [4]])
def test_normalize_pages_rejects_out_of_range_pages(pages: list[int]) -> None:
    with pytest.raises(ValueError, match=r"out of range 1\.\.3"):
        _normalize_pages(pages, 3)
