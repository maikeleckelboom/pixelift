export function getTypeName(value: unknown): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}

export function safePipe<T>(
  base: ReadableStream<T>,
  transforms: TransformStream<T, T>[],
  maxDepth = 3
): ReadableStream<T> {
  if (transforms.length > maxDepth) {
    throw new Error(`Too many transform layers: ${transforms.length}`);
  }
  return transforms.reduce((s, t) => s.pipeThrough(t), base);
}
