[![npm version](https://img.shields.io/npm/v/pixelift.svg)](https://www.npmjs.com/package/pixelift)
[![bundle size](https://img.shields.io/bundlephobia/minzip/pixelift)](https://bundlephobia.com/package/pixelift)
[![downloads](https://img.shields.io/npm/dm/pixelift)](https://www.npmjs.com/package/pixelift)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/maikeleckelboom/pixelift/blob/main/LICENSE)

# Pixelift

**Cross-platform image decoder**—convert any image source (URL, file, Blob, HTML element, etc.) into consistent 8-bit
RGBA pixels via one lightweight API for both browser and Node.js.

---

## 📋 Table of Contents

1. [Why Pixelift?](#why-pixelift)
2. [Features](#features)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Browser vs Server](#browser-vs-server)
6. [Advanced Usage](#advanced-usage)
7. [API Reference](#api-reference)
8. [Contributing](#contributing)
9. [License](#license)

---

## Why Pixelift?

* 🎯 **One API** for **all** image sources (URLs, file paths, buffers, HTML elements, video frames, blobs, …)
* ⚡️ **High performance**: Leverages WebCodecs/OffscreenCanvas in browser and Sharp on server
* 🔄 **Consistent output**: Pixel-perfect identical RGBA for lossless formats; near-identical for lossy formats
* 🔍 **Format-agnostic**: JPEG, PNG, GIF, WebP, AVIF, SVG, etc.
* 🔧 **Fully typed**: Built in TypeScript with zero dependencies in the browser

---

## Features

* ✅ Decode from `string|URL|File|Blob|HTMLImageElement|HTMLVideoElement|Canvas…`
* ✅ Automatic runtime detection (browser ↔ Node.js)
* ✅ Pure TypeScript, zero dependencies in browser
* ✅ Modular exports (`./browser`, `./server`)
* ✅ Robust error handling with clear codes (throws `PixeliftError`)
* ✅ Tree-shakable, no side effects

---

## Installation

```bash
# npm
npm install pixelift

# yarn
yarn add pixelift

# pnpm
pnpm add pixelift

# bun
bun add pixelift
```

> **Server:** Pixelift uses [sharp](https://github.com/lovell/sharp) for server-side decoding; ensure it's installed.
>
> ```bash
> npm install sharp
> ```

---

## Quick Start

```ts
import {pixelift} from 'pixelift';

async function run() {
    const {data, width, height} = await pixelift('path/to/image.jpg');
    console.log(`Decoded ${width}×${height}, ${data.length} bytes`);
}

run();
```

---

## Browser vs Server

### Browser

* Defaults to WebCodecs
* Falls back to OffscreenCanvas
* No native bindings required

### Server

* Requires `sharp`
* Leverages native bindings for performance

---

## Advanced Usage

### Force a specific decoder

```ts
pixelift(url, {decoder: 'offscreenCanvas'});
```

### Abort long requests

```ts
const controller = new AbortController();
pixelift(url, {signal: controller.signal});
// …
controller.abort();
```

---

## API Reference

### `pixelift(input, options?) → Promise<PixelData>`

* **input**: `string | URL | File | Blob | Buffer | ArrayBuffer | Uint8Array`
* **options**: `{ headers?: Record<string, string>; signal?: AbortSignal; decoder?: 'webcodecs' | 'offscreen-canvas' }`
* **returns**:

  ```ts
  interface PixelData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }
  ```

### `argbFromRgbaBytes(buffer, options?) → number[] | Uint32Array`

* Converts RGBA bytes to ARGB ints
* **options**: `{ useTypedArray?: boolean }`

### `rgbaBytesFromArgb(pixels) → Uint8ClampedArray`

* Converts ARGB ints back to RGBA bytes

---

## Conversion Examples

### Red Tint

Apply a red tint by maxing out the red channel:

```ts
import {argbFromRgbaBytes, rgbaBytesFromArgb} from 'pixelift';

// Get pixel data as ARGB integers
const pixels = argbFromRgbaBytes(source.data);

// Set red channel to 255
const tinted = pixels.map((color) => (color & 0x00ffffff) | (0xff << 16));

// Convert back to RGBA bytes
const resultData = rgbaBytesFromArgb(tinted);
```

### Invert Colors

Invert RGB channels while preserving alpha:

```ts
import {argbFromRgbaBytes, rgbaBytesFromArgb} from 'pixelift';

const pixels = argbFromRgbaBytes(source.data);

const inverted = pixels.map((c) => {
    const a = (c >>> 24) & 0xff;
    const r = (c >>> 16) & 0xff;
    const g = (c >>> 8) & 0xff;
    const b = c & 0xff;
    return ((a << 24) | ((255 - r) << 16) | ((255 - g) << 8) | (255 - b)) >>> 0;
});

const resultData = rgbaBytesFromArgb(inverted);
```

---

## License

This project is licensed under the MIT License.

---

## Contributing

Contributions welcome! Please check out the [issue tracker](https://github.com/maikeleckelboom/pixelift/issues) or open
a pull request.
