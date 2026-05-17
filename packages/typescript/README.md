# @doradsoft/out-of-black-ink

TypeScript utilities for recoloring black and gray image data to color ink.

This package contains the reusable browser-side core used by the web app. It does not upload
files, call external APIs, or perform server-side PDF conversion.

## Install

```bash
npm install @doradsoft/out-of-black-ink
```

## Usage

```ts
import { hexToRgb, recolorImageData } from "@doradsoft/out-of-black-ink";

const target = hexToRgb("#0080b8");
recolorImageData(imageData, target, 235, 38);
```
