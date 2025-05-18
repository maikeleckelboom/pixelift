/**
 * Creates a proxy around the provided input object that intercepts the `close` method.
 * The intercepted `close` method ensures the input object is properly closed
 * and then returns the input object itself.
 */
export function autoClose<T extends VideoFrame | ImageBitmap>(input: T): T {
  return new Proxy(input, {
    get(target, prop) {
      if (prop === 'close') {
        return () => {
          target.close();
          return input;
        };
      }
      return Reflect.get(target, prop);
    }
  });
}

/**
 * Utility to auto-close an ImageBitmap or VideoFrame after use.
 * Ensures `.close()` is called even on exceptions.
 */
export async function withAutoClose<T extends { close: () => void }, R>(
  resource: T,
  fn: (resource: T) => Promise<R>
): Promise<R> {
  try {
    return await fn(resource);
  } finally {
    resource.close();
  }
}
