export const isNode =
  typeof process !== 'undefined' &&
  process.versions?.node &&
  !process.versions.electron

export const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'
