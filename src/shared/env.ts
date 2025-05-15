export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isServer(): boolean {
  return typeof process !== 'undefined' && typeof process.versions === 'object';
}
