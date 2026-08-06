/**
 * Einziger Zugriffspunkt auf persistenten lokalen Speicher.
 *
 * Direkte `localStorage`-Aufrufe sind im Rest der App bewusst verboten: für die
 * spätere Capacitor-Portierung muss nur dieser Adapter gegen `Preferences`
 * getauscht werden. Der In-Memory-Fallback greift, wenn `localStorage`
 * blockiert ist (Privatmodus, eingebettete WebViews).
 */

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  keys(): string[]
}

function createMemoryAdapter(): StorageAdapter {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    keys: () => [...map.keys()],
  }
}

function createWebAdapter(): StorageAdapter | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const probe = '__k10_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
  } catch {
    return null
  }
  const ls = window.localStorage
  return {
    getItem: (key) => ls.getItem(key),
    setItem: (key, value) => ls.setItem(key, value),
    removeItem: (key) => ls.removeItem(key),
    keys: () => Object.keys(ls),
  }
}

const PREFIX = 'k10:'

let adapter: StorageAdapter = createWebAdapter() ?? createMemoryAdapter()

/** Ermöglicht Tests und die spätere Native-Schicht, den Adapter auszutauschen. */
export function setStorageAdapter(next: StorageAdapter): void {
  adapter = next
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    const raw = adapter.getItem(PREFIX + key)
    if (raw === null) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      // Beschädigte Einträge dürfen die App nicht blockieren.
      adapter.removeItem(PREFIX + key)
      return fallback
    }
  },

  set(key: string, value: unknown): void {
    try {
      adapter.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Quota überschritten oder Speicher gesperrt – kein harter Fehler.
    }
  },

  remove(key: string): void {
    adapter.removeItem(PREFIX + key)
  },

  /** Entfernt alle Schlüssel der App, z. B. beim vollständigen Zurücksetzen. */
  clearNamespace(): void {
    for (const key of adapter.keys()) {
      if (key.startsWith(PREFIX)) adapter.removeItem(key)
    }
  },
}

/** Zentrale Schlüsselliste – verhindert Tippfehler und Kollisionen. */
export const StorageKeys = {
  ageConfirmed: 'age-confirmed',
  settings: 'settings',
  deviceId: 'device-id',
  sessionId: 'session-id',
  impostorConfig: 'impostor:config',
  impostorRound: 'impostor:round',
  impostorUsedTerms: 'impostor:used-terms',
  termPool: 'terms:pool',
  roomMembership: 'whoami:membership',
  roomNotesDraft: 'whoami:notes-draft',
} as const
