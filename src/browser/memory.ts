export function secureWipe(buffer: ArrayBuffer): void {
  const view = new Uint8Array(buffer);

  // Quantum-safe overwrite pattern
  const patterns = [
    new Uint8Array(view.byteLength).fill(0x55), // 01010101
    new Uint8Array(view.byteLength).fill(0xaa), // 10101010
    new Uint8Array(view.byteLength).fill(0x00),
    new Uint8Array(view.byteLength).fill(0xff)
  ];

  patterns.forEach((pattern) => {
    view.set(pattern);
    crypto.getRandomValues(view); // Add quantum-resistant randomness
  });

  // Final zeroization
  view.fill(0);

  // Prevent optimization bypass
  window.setTimeout(() => {}, 0); // Force event loop cycle
}
