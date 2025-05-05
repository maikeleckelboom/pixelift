[//]: # ([![npm version]&#40;https://img.shields.io/npm/v/pixelift.svg&#41;]&#40;https://www.npmjs.com/package/pixelift&#41;)
[//]: # ([![Build Status]&#40;https://img.shields.io/github/workflow/status/maikeleckelboom/pixelift/CI/main&#41;]&#40;&#41;)
[//]: # ([![npm bundle size]&#40;https://img.shields.io/bundlephobia/minzip/pixelift&#41;]&#40;https://bundlephobia.com/package/pixelift&#41;)
[//]: # ([![npm downloads]&#40;https://img.shields.io/npm/dm/pixelift.svg&#41;]&#40;https://www.npmjs.com/package/pixelift&#41;)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/maikeleckelboom/pixelift/blob/main/LICENSE)

# Pixelift

Unified API for decoding various image sources into raw 8-bit RGBA pixels, consistently in both browser and server.

---

## 🔍 Overview

**Pixelift provides a unified API to decode images from a variety of sources—URLs, file paths, buffers, HTML elements,
video frames, canvas elements, blobs, and more—into raw pixel data (`Uint8ClampedArray`) in a consistent 8-bit per
channel RGBA format, along with width and height information.** It automatically detects your runtime environment and
dispatches to the appropriate implementation:

- **Browser**: Automatically selects the best available decoding strategy, prioritizing the modern **WebCodecs API** and
  falling back to the widely compatible **OffscreenCanvas API**. You can also force a specific decoder.
- **Server (Node.js)**: **Exclusively leverages [Sharp](https://github.com/lovell/sharp)** for high-performance, native
  image decoding and conversion.

A core goal of Pixelift is to ensure **consistent output**: the raw pixel data obtained from the _exact same image
source_ is designed to be **pixel-by-pixel identical** (in the 8-bit RGBA format) whether decoded by Sharp on the server
or the chosen mechanism in the browser, matching Sharp's standard output.

**Key features:**

- Multi-format support: JPEG, PNG, GIF, WebP, AVIF, SVG, etc.
- Broad source compatibility: `string`, `URL`, `File`, `Blob`, `HTMLImageElement`, `HTMLVideoElement`,
  `HTMLCanvasElement`, `OffscreenCanvas`, `ImageBitmap`, `VideoFrame`, `ImageData`, `Buffer`, `ArrayBuffer`,
  `TypedArray`.
- Robust error handling: Distinct error class (`PixeliftError`) provides clear codes and stack traces. Includes helpful
  guidance if the `sharp` dependency is missing on the server.
- Pure TypeScript: Strong types and built-in validation utilities.

* ***Server-side decoding (requires Sharp):** For high-performance decoding in Node.js, Pixelift requires the native *
  *Sharp** library. Install it as a dependency in your project (`npm install sharp`). Sharp is automatically excluded
  from browser bundles.

- **Modular structure**: The project is organized into a modular structure, separating browser and server
  implementations while sharing common utilities.

---

## ⚙️ Installation

You can install **Pixelift** in one step using any of the four major JavaScript package managers—npm, Yarn, pnpm, or
Bun—by running the respective `install`/`add` command.

1. **npm**

   ```bash
   npm install pixelift
   ```
2. **yarn**

   ```bash
   yarn add pixelift
   ```
3. **pnpm**

   ```bash
   pnpm add pixelift
   ```
4. **bun**

   ```bash
   bun add pixelift
   ```

### Server Requirements

For server-side decoding, **Pixelift** requires the native **Sharp** library.

```bash
npm install sharp
```

---

## Quick Start

```ts
import { pixelift } from 'pixelift';

const pixelData = await pixelift('path/to/image.jpg');

// ▶ pixelData
// { 
//   data: Uint8ClampedArray(160000) [ 23, 27, 153, 255, … ],
//   width: 200,
//   height: 200
// }
```

## `unpackPixels` and `packPixels`

### Red Tint

Apply a red tint by maxing out the red channel:

```ts
import { unpackPixels, packPixels } from 'pixelift';

// Get pixel data as ARGB integers
const pixels = unpackPixels(source.data);

// Set red channel to 255
const tinted = pixels.map((color) => (color & 0x00ffffff) | (0xff << 16));

// Convert back to RGBA bytes
const resultData = packPixels(tinted);
```

### Invert Colors

Invert RGB channels while preserving alpha:

```ts
import { unpackPixels, packPixels } from 'pixelift';

const pixels = unpackPixels(source.data);

const inverted = pixels.map((c) => {
  const a = (c >>> 24) & 0xff;
  const r = (c >>> 16) & 0xff;
  const g = (c >>> 8) & 0xff;
  const b = c & 0xff;
  return ((a << 24) | ((255 - r) << 16) | ((255 - g) << 8) | (255 - b)) >>> 0;
});

const resultData = packPixels(inverted);
```
---

## API

### `pixelift(input, options?) → Promise<PixelData>`

- **input**: `string | URL | File | Blob | Buffer | ArrayBuffer | Uint8Array`
- **options**:
    - `headers?`: `Record<string, string>` — for custom headers
    - `signal?`: `AbortSignal` — for aborting the request

**Returns** a Promise resolving to:

```ts
interface PixelData {
  data: Uint8ClampedArray; // RGBA bytes
  width: number;
  height: number;
}
```

### `unpackPixels(buffer, options?) → number[] | Uint32Array`

- Converts RGBA bytes to 32-bit ARGB values.
- **options**:
    - `useTArray?`: `boolean` (default `true`)

### `packPixels(pixels) → Uint8ClampedArray`

- Converts ARGB integers back to RGBA bytes.


---

## Contributing & License

Contributions welcome: see [issues](https://github.com/maikeleckelboom/pixelift/issues).
