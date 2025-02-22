import { isNode } from "../shared/env";

let createPixelsFromImage: any;

if (isNode) {
  const { default: nodeImpl } = await import("./node/image");
  createPixelsFromImage = nodeImpl;
} else {
  const { default: browserImpl } = await import("./browser/image");
  createPixelsFromImage = browserImpl;
}

export { createPixelsFromImage };
