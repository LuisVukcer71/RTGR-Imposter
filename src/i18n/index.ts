import { DEFAULT_LOCALE, type Locale } from '@shared/config'
import { de, type MessageKey } from './de'

/**
 * Bewusst minimales i18n. Es gibt vorerst nur Deutsch; die Struktur ist so
 * angelegt, dass eine zweite Sprache nur ein weiteres Nachrichtenobjekt und
 * einen Eintrag in `catalogs` braucht.
 */
const catalogs: Record<Locale, Record<string, string>> = {
  de,
}

let activeLocale: Locale = DEFAULT_LOCALE

export function setLocale(locale: Locale): void {
  activeLocale = locale
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

export function getLocale(): Locale {
  return activeLocale
}

export type MessageParams = Record<string, string | number>

/** Übersetzt einen Schlüssel und ersetzt `{platzhalter}` durch die Parameter. */
export function t(key: MessageKey, params?: MessageParams): string {
  const template = catalogs[activeLocale][key] ?? catalogs[DEFAULT_LOCALE][key]
  if (template === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] Kein Text für "${key}"`)
    return key
  }
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

/** Sonderfall: Schlüssel, die erst zur Laufzeit feststehen (z. B. Fehlercodes). */
export function tDynamic(key: string, params?: MessageParams, fallback?: string): string {
  if (key in catalogs[activeLocale]) return t(key as MessageKey, params)
  return fallback ?? key
}

export function useI18n() {
  return { t, tDynamic, locale: getLocale, setLocale }
}
