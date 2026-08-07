import { json, type Handler } from '../http.js'
import { pseudonymize } from '../services/crypto.js'
import { getStore } from '../store/index.js'
import type { AnalyticsEventInput } from '../store/types.js'

/**
 * Aufnahme anonymer Ereignisse.
 *
 * Es wird eine geschlossene Liste von Ereignisnamen und Payload-Feldern
 * akzeptiert. Freitext, Spielernamen, Wer-bin-ich-Begriffe und private Notizen
 * können damit gar nicht erst in die Analytics gelangen – selbst wenn ein
 * manipulierter Client sie mitschickt.
 */

const ALLOWED_EVENTS = new Set([
  'app_session_start',
  'game_opened',
  'impostor_setup_opened',
  'impostor_setup_abandoned',
  'impostor_round_started',
  'impostor_round_completed',
  'impostor_term_drawn',
  'whoami_room_created',
  'whoami_room_joined',
  'whoami_round_started',
  'suggestion_submitted',
])

const ALLOWED_CATEGORIES = new Set([
  'Alltag',
  'Internet & Social Media',
  'Berufe',
  'Promis',
  'Filme & Serien',
  'Gaming',
  'Gegenstände',
])

function sanitizePayload(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) return {}
  const input = raw as Record<string, unknown>
  const clean: Record<string, unknown> = {}

  const number = (key: string, max: number) => {
    const value = input[key]
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max) {
      clean[key] = Math.round(value)
    }
  }
  const boolean = (key: string) => {
    if (typeof input[key] === 'boolean') clean[key] = input[key]
  }

  if (input.mode === 'impostor' || input.mode === 'whoami') clean.mode = input.mode
  number('playerCount', 20)
  number('impostorCount', 7)
  number('roundsInSession', 1000)
  boolean('hintsEnabled')
  boolean('timerEnabled')
  boolean('online')

  if (Array.isArray(input.categories)) {
    const categories = input.categories.filter(
      (entry): entry is string => typeof entry === 'string' && ALLOWED_CATEGORIES.has(entry),
    )
    if (categories.length > 0) clean.categories = categories
  }
  // Nur eine UUID-artige Kennung, niemals der Begriff selbst.
  if (typeof input.termId === 'string' && /^[\w-]{1,64}$/.test(input.termId)) {
    clean.termId = input.termId
  }

  return clean
}

export const postAnalyticsEvents: Handler = async (req) => {
  const payload = (req.body ?? {}) as {
    deviceId?: unknown
    sessionId?: unknown
    events?: unknown
  }

  const deviceId = typeof payload.deviceId === 'string' ? payload.deviceId : ''
  const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : ''
  if (!deviceId || !sessionId || !Array.isArray(payload.events)) return json({ accepted: 0 })

  const deviceHash = pseudonymize(deviceId, 'analytics-device')
  const sessionHash = pseudonymize(sessionId, 'analytics-session')
  const now = Date.now()

  const events: AnalyticsEventInput[] = []
  for (const entry of payload.events.slice(0, 100)) {
    if (typeof entry !== 'object' || entry === null) continue
    const event = entry as Record<string, unknown>
    if (typeof event.name !== 'string' || !ALLOWED_EVENTS.has(event.name)) continue

    const parsed = typeof event.occurredAt === 'string' ? Date.parse(event.occurredAt) : NaN
    // Zeitstempel aus der Zukunft oder älter als sieben Tage werden begradigt.
    const occurredAt = Number.isFinite(parsed)
      ? new Date(Math.min(Math.max(parsed, now - 7 * 24 * 3600_000), now)).toISOString()
      : new Date(now).toISOString()

    events.push({
      name: event.name,
      deviceHash,
      sessionHash,
      payload: sanitizePayload(event.payload),
      occurredAt,
    })
  }

  if (events.length === 0) return json({ accepted: 0 })
  const accepted = await getStore().analytics.insertMany(events)
  return json({ accepted })
}
