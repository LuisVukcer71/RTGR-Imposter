import { storage, StorageKeys } from './storage'

/**
 * Anonyme Gerätekennung und Sitzungskennung.
 *
 * Beides ist eine zufällige ID ohne Personenbezug. Sie dient dem Rate-Limit für
 * Wortvorschläge und der Analytics-Zählung „Geräte“ bzw. „Sitzungen“ – niemals
 * der Identifikation einer Person.
 */

export function randomId(bytes = 16): string {
  const array = new Uint8Array(bytes)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < bytes; i++) array[i] = Math.floor(Math.random() * 256)
  }
  return [...array].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

let cachedDeviceId: string | null = null

/** Bleibt über Sitzungen hinweg bestehen, solange der Nutzer den Speicher nicht leert. */
export function deviceId(): string {
  if (cachedDeviceId) return cachedDeviceId
  let id = storage.get<string | null>(StorageKeys.deviceId, null)
  if (!id) {
    id = randomId()
    storage.set(StorageKeys.deviceId, id)
  }
  cachedDeviceId = id
  return id
}

interface SessionRecord {
  id: string
  startedAt: number
  lastSeenAt: number
}

/** Nach 30 Minuten ohne Aktivität gilt der nächste Aufruf als neue Sitzung. */
const SESSION_IDLE_MS = 30 * 60 * 1000

export function sessionId(): string {
  const now = Date.now()
  const existing = storage.get<SessionRecord | null>(StorageKeys.sessionId, null)
  if (existing && now - existing.lastSeenAt < SESSION_IDLE_MS) {
    storage.set(StorageKeys.sessionId, { ...existing, lastSeenAt: now })
    return existing.id
  }
  const record: SessionRecord = { id: randomId(12), startedAt: now, lastSeenAt: now }
  storage.set(StorageKeys.sessionId, record)
  return record.id
}
