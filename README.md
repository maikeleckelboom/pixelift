# Pixelift
A lightweight image processing library for Node.js and browsers.

## Installation
```bash
npm install pixelift
````

---

## Usage
### Browser
```ts
import { pixelift } from 'pixelift'
const { data, width, height } = await pixelift('image.png');
```

#### Options (Browser)
```ts
export type BrowserOptions = {
  /**
   * Alpha premultiplication (default: browser's default behavior)
   * - 'none': Keep RGB unmodified
   * - 'premultiply': Multiply RGB by alpha
   * - 'default': Browser chooses
   */
  premultiplyAlpha?: 'none' | 'premultiply' | 'default';
  
  /**
   * Color space conversion during decoding (default: 'default')
   * - 'none': Preserve original color space
   * - 'default': Convert to display's color space
   */
  colorSpaceConversion?: 'none' | 'default';
  
  /**
   * Output color space (default: 'srgb')
   */
  outputColorSpace?: 'srgb' | 'display-p3';
};
```
### Node
```ts
import { pixelift } from 'pixelift';

const { data, width, height } = await pixelift('./image.jpg', { format: 'jpg', formatAsRGBA: true });
``` 

#### Options (Node)
```ts
export type NodeOptions = {
  /**
   * Image format (default: 'auto')
   * - 'auto': Automatically detect format
   * - 'jpeg': JPEG
   * - 'png': PNG
   */
  format?: 'auto' | 'jpeg' | 'png';
  
  /**
   * Output as RGBA (default: false)
   */
  formatAsRGBA?: boolean;
};
```

---
To install dependencies:
```bash
bun install
```
To run:
```bash
bun run index.ts
```
This project was created using `bun init` in bun v1.2.3. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
