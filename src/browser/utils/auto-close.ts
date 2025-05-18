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
