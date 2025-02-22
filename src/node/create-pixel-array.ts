import { default as sharp } from "sharp";

export default async function createPixelsFromImage(src: string) {
  if (!sharp) {
    throw new Error(`
            pixelite requires sharp in Node.js environment.
            Install with: bun add sharp
        `);
  }

  // Sharp implementation...
}
