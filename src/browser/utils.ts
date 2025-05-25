export function isTransferable(value: any): value is Transferable {
  return (
    value instanceof ArrayBuffer ||
    value instanceof MessagePort ||
    value instanceof ImageBitmap ||
    (typeof OffscreenCanvas !== 'undefined' && value instanceof OffscreenCanvas)
  );
}

export function toTransferable(value: any): Transferable | Transferable[] | null {
  if (isTransferable(value)) {
    return value;
  } else if (Array.isArray(value) && value.every(isTransferable)) {
    return value;
  }
  return null;
}
