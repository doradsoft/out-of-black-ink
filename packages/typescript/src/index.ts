export type RgbColor = [number, number, number];

export const normalizeHexColor = (value: string): string => {
  const trimmed = value.trim();
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error("Color must be in #RRGGBB format.");
  }
  return hex.toLowerCase();
};

export const hexToRgb = (value: string): RgbColor => {
  const hex = normalizeHexColor(value).slice(1);
  return [0, 2, 4].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16),
  ) as RgbColor;
};

export const parsePages = (value: string, pageCount: number): number[] => {
  if (!value.trim()) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = value
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((page) => Number.isInteger(page));

  if (pages.length === 0) {
    throw new Error(
      "Pages must be comma-separated page numbers, such as 1,3,5.",
    );
  }

  for (const page of pages) {
    if (page < 1 || page > pageCount) {
      throw new Error(`Page ${page} is out of range 1..${pageCount}.`);
    }
  }

  return pages;
};

export const recolorImageData = (
  imageData: ImageData,
  target: RgbColor,
  threshold: number,
  maxSaturation: number,
): ImageData => {
  const { data } = imageData;
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    if (red === undefined || green === undefined || blue === undefined) {
      continue;
    }
    const maxColor = Math.max(red, green, blue);
    const minColor = Math.min(red, green, blue);
    const luminance = Math.floor((299 * red + 587 * green + 114 * blue) / 1000);
    const saturation = maxColor - minColor;

    if (luminance < threshold && saturation < maxSaturation) {
      const alpha = Math.max(0, Math.min(255, 255 - luminance)) / 255;
      data[index] = Math.floor(255 - (255 - target[0]) * alpha);
      data[index + 1] = Math.floor(255 - (255 - target[1]) * alpha);
      data[index + 2] = Math.floor(255 - (255 - target[2]) * alpha);
    }
  }
  return imageData;
};
