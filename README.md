# Pixelift

[![npm version](https://img.shields.io/npm/v/pixelift.svg)](https://www.npmjs.com/package/pixelift) [![Build Status](https://img.shields.io/github/actions/workflow/status/maikeleckelboom/pixelift/ci.yml?branch=main)](https://github.com/maikeleckelboom/pixelift/actions)

A lightweight TypeScript library for extracting raw pixel data from images in both Node.js (via Sharp) and browsers (via
Canvas API).

---

## Installation

Pixelift provides dual-format builds—supporting both ESM and CommonJS—tailored for different environments.

```npm
# Full package (auto-detects runtime: browser or Node.js)
npm install pixelift

# Browser-only (optimized for ESM bundlers)
npm install pixelift/browser

# Server-only (optimized for Node.js, supports both ESM and CommonJS)
npm install pixelift/server
```

---

## Quick Start

### Browser

```ts
const { data, width, height } = await pixelift('/private/img.jpg', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### Node

```ts
import fs from 'fs/promises';
import { pixelift } from 'your-lib';

const { data, width, height } = await pixelift('https://api.example.com/secret.jpg', {
  headers: {
    'X-API-Key': process.env.API_KEY!
  }
});

// maybe write raw bytes somewhere
await fs.writeFile('out.raw', data);
```

## API

### `pixelift(input, options?) → Promise<PixelData>`

- **input**: `string | URL | File | Blob | Buffer | ArrayBuffer | Uint8Array`
- **options**:
  - `width?`: number — target width (nearest-neighbor)
  - `height?`: number — target height

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

## Examples Using `unpackPixels` and `packPixels`

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

## Contributing & License

Contributions welcome: see [issues](https://github.com/maikeleckelboom/pixelift/issues).
