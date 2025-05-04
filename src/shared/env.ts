export function isServer(): boolean {
  if (typeof window !== 'undefined' || typeof self !== 'undefined') {
    return false;
  }
  return typeof process !== 'undefined' && !!process.versions?.node;
}
