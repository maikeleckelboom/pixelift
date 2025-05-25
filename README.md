# Pixelift

> **Cross-environment raw image decoder.**
> Decode any image-like source into 8-bit RGBA pixels with a single, consistent API for both browser and Node.js.

[![npm version](https://img.shields.io/npm/v/pixelift.svg)](https://www.npmjs.com/package/pixelift)
[![bundle size](https://img.shields.io/bundlephobia/minzip/pixelift)](https://bundlephobia.com/package/pixelift)
[![downloads](https://img.shields.io/npm/dm/pixelift)](https://www.npmjs.com/package/pixelift)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/maikeleckelboom/pixelift/blob/main/LICENSE)

---

## 🚨 Scope Boundary — DO NOT CROSS

**Pixelift only decodes.** One API, cross-environment, consistent RGBA output — from any image-like source (URL, buffer,
stream, HTML element).

**✅ Does:**

* Decode to `{ data: Uint8ClampedArray, width: number, height: number }`
* Run identically in **browser** and **Node.js**
* Accept: `string`, `URL`, `Buffer`, `Blob`, `File`, `ReadableStream`, `Response`, `HTML element`, etc.
* Provide RGBA/ARGB conversions
* Support **streams** as input — with byte-level progress reporting

**❌ Does NOT:**

* ✘ Transform, filter, encode, or render
* ✘ Resize, crop, or draw
* ✘ Write to disk or export images
* ✘ Use WebCodecs (support removed)

Keep it pure. Keep it focused.

---

## 📦 Install

```bash
# Choose your package manager:
npm install pixelift
yarn add pixelift
pnpm add pixelift
bun add pixelift

# Server only: install sharp manually
npm install sharp
```

---

## ⚡ Quick Start

```ts
import {pixelift} from 'pixelift';

const {data, width, height} = await pixelift('path/to/image.jpg');
console.log(`Decoded ${width}×${height}, ${data.length} bytes`);
```

---

## 🌍 Environment Support

### Browser

* Uses **OffscreenCanvas** for high-performance decoding
* No native dependencies

### Node.js

* Requires `sharp`
* Uses native bindings for speed

---

## 🔧 Input Types

```ts
await pixelift(input, options ?);
```

**Accepted `input`:**

* `string` (URL or file path)
* `URL`
* `Blob`, `File`, `Buffer`, `ArrayBuffer`, `Uint8Array`
* `HTMLImageElement`, `HTMLVideoElement`, `HTMLCanvasElement`
* `ReadableStream`, `Response`

**Options:**

```ts
interface PixeliftOptions {
    headers?: Record<string, string>;
    signal?: AbortSignal;
    decoder?: 'offscreen-canvas' | 'sharp';
    onProgress?: (bytesProcessed: number) => void;
    maxBytes?: number;
    chunkSize?: number;
}
```

**Returns:**

```ts
interface PixelData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
}
```

---

## 🔁 Utility Conversions

### `argbFromRgbaBytes(buffer, options?)`

Convert RGBA bytes → ARGB integers

### `rgbaBytesFromArgb(pixels)`

Convert ARGB integers → RGBA bytes

---

## 🎨 Examples

### Tint Red

```ts
import {argbFromRgbaBytes, rgbaBytesFromArgb} from 'pixelift';

const pixels = argbFromRgbaBytes(source.data);
const tinted = pixels.map(c => (c & 0x00ffffff) | (0xff << 16));
const result = rgbaBytesFromArgb(tinted);
```

### Invert Colors

```ts
const inverted = pixels.map((c) => {
    const a = (c >>> 24) & 0xff;
    const r = (c >>> 16) & 0xff;
    const g = (c >>> 8) & 0xff;
    const b = c & 0xff;
    return ((a << 24) | ((255 - r) << 16) | ((255 - g) << 8) | (255 - b)) >>> 0;
});
```

---

## 🌐 Real World Usage: Streams + Progress (Cross-Env)

Pixelift provides native support for streaming sources and `Response` objects in both browser and Node.js. The same
interface works identically in either environment.

### Supported Streaming Options

```ts
interface StreamControlOptions {
    signal?: AbortSignal;
    maxBytes?: number;              // Optional cap on total bytes to read
    chunkSize?: number;             // Optional enforced chunking
    onProgress?: (bytesProcessed: number) => void; // Progress callback
}
```

### Decode from HTTP Response (browser or Node with fetch)

```ts
const response = await fetch('https://example.com/image.webp');
const result = await pixelift(response, {
    onProgress: (bytes) => console.log(`Fetched ${bytes} bytes`),
});
```

### Stream from File Input (browser)

```ts
const file = document.querySelector('input[type=file]').files[0];
const result = await pixelift(file.stream(), {
    onProgress: (bytes) => console.log(`Read ${bytes} bytes from file`),
    chunkSize: 65536,
    maxBytes: 10 * 1024 * 1024,
});
```

### Pipe from Node.js FileSystem

```ts
import {createReadStream} from 'node:fs';

const stream = createReadStream('./image.png');

const result = await pixelift(stream, {
    onProgress: (bytes) => console.log(`Streaming ${bytes} bytes from disk`),
    signal: AbortSignal.timeout(5000),
});
```

---

## 🧠 Philosophy

> **Pixelift decodes. Period.**
>
> One job. One API. One output. Don't render, process, or export — decode.

---

## 🤝 Contributing

We welcome contributions! Please read the scope and philosophy first. PRs that add rendering, resizing, or encoding will
not be accepted.

---

## 📄 License

MIT © [Maike Leckelboom](https://github.com/maikeleckelboom)
