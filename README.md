# Pixelift

[![npm version](https://img.shields.io/npm/v/pixelift.svg)](https://www.npmjs.com/package/pixelift) [![Build Status](https://img.shields.io/github/actions/workflow/status/maikeleckelboom/pixelift/ci.yml?branch=main)](https://github.com/maikeleckelboom/pixelift/actions)

An TypeScript library for extracting raw pixel data from images in both Node.js (via Sharp) and browsers (via
WebGL API).
---

## Installation

Pixelift provides dual-format builds—supporting both ESM and CommonJS—tailored for different environments.

#### Universal (Node + Browser)
```bash
npm install pixelift
```

#### Browser-only
```bash
npm install pixelift/browser
```

#### Server-only
```bash
npm install pixelift/server
```

### Server Requirements

Install `sharp` for server-side processing:
```bash
npm install sharp
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
