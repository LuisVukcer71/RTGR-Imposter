import { APP_NAME, DEFAULT_LOCALE, FEATURES, THEME } from '@shared/config'

/**
 * Umgebungsabhängige Konfiguration des Clients. Alles, was hier steht, darf
 * öffentlich sein – Secrets gehören ausschließlich auf den Server.
 */

function readBaseUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_BASE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export const runtimeConfig = {
  appName: APP_NAME,
  locale: DEFAULT_LOCALE,
  theme: THEME,
  features: FEATURES,
  /** Basis-URL für Deep Links und QR-Codes. */
  baseUrl: readBaseUrl(),
  apiBase: '/api',
  version: __APP_VERSION__,
  isDev: import.meta.env.DEV,
} as const

/** Deep Link zu einem Raum – wird auch für den QR-Code verwendet. */
export function roomDeepLink(code: string): string {
  return `${runtimeConfig.baseUrl}/room/${code}`
}
