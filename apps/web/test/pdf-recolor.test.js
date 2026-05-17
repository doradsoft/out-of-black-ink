import assert from "node:assert/strict";
import test from "node:test";

import {
  hexToRgb,
  normalizeHexColor,
  parsePages,
  recolorImageData,
} from "../src/pdf-recolor.js";

const imageData = (pixels) => ({
  data: new Uint8ClampedArray(
    pixels.flatMap(([red, green, blue]) => [red, green, blue, 255]),
  ),
});

const pixels = (data) => {
  const output = [];
  for (let index = 0; index < data.length; index += 4) {
    output.push([data[index], data[index + 1], data[index + 2]]);
  }
  return output;
};

test("normalizes hex colors", () => {
  assert.equal(normalizeHexColor("0080B8"), "#0080b8");
  assert.equal(normalizeHexColor("#0080b8"), "#0080b8");
});

test("rejects invalid hex colors", () => {
  assert.throws(() => normalizeHexColor("#12345"), /#RRGGBB/);
  assert.throws(() => normalizeHexColor("#zzzzzz"), /#RRGGBB/);
});

test("converts hex colors to rgb", () => {
  assert.deepEqual(hexToRgb("#0080b8"), [0, 128, 184]);
});

test("parses selected pages", () => {
  assert.deepEqual(parsePages("", 3), [1, 2, 3]);
  assert.deepEqual(parsePages("1, 3", 3), [1, 3]);
});

test("rejects out-of-range pages", () => {
  assert.throws(() => parsePages("4", 3), /out of range 1..3/);
});

test("recolors neutral dark pixels and preserves saturated pixels", () => {
  const data = imageData([
    [0, 0, 0],
    [128, 128, 128],
    [255, 0, 0],
  ]);

  recolorImageData(data, [0, 120, 170], 235, 38);

  assert.deepEqual(pixels(data.data), [
    [0, 120, 170],
    [128, 187, 212],
    [255, 0, 0],
  ]);
});
