export async function isNodeReadable(input: unknown): Promise<boolean> {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const { Readable } = await import('stream');
      return input instanceof Readable;
    } catch {
      return false;
    }
  }
  return false;
}

export async function isNodeBuffer(input: unknown): Promise<boolean> {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const { Buffer } = await import('buffer');
      return input instanceof Buffer;
    } catch {
      return false;
    }
  }
  return false;
}
