export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage nicht verfügbar (z.B. privater Modus) - Einstellungen einfach nicht persistieren
  }
}

/**
 * Prüft per Schreib-/Löschtest, ob localStorage tatsächlich nutzbar ist
 * (z.B. false im privaten Safari-Modus mit voller Quota). Für Features, die
 * dem Nutzer aktiv mitteilen müssen, dass etwas nur für die Sitzung gilt.
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__imposter_storage_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}
