/// <reference types="vite/client" />

declare module '*.snap' {
  const content: Record<string, string>;
  export default content;
}
