export const isNode = () => {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions?.node !== 'undefined' &&
    !(process.versions as any).electron &&
    // Vite special case
    process.env.BUILD_TARGET !== 'browser'
  )
}