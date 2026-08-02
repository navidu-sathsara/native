declare module '*.png' {
  const url: string
  export default url
}

/** package.json version, injected at build time via electron.vite.config.ts `define`. */
declare const __APP_VERSION__: string
