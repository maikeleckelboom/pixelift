export function getTypeName(value: unknown): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}
