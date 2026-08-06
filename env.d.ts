/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Wird von Vite aus der package.json-Version gesetzt. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** Öffentliche Basis-URL für Deep Links und QR-Codes, z. B. https://komm10te.vercel.app */
  readonly VITE_PUBLIC_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
