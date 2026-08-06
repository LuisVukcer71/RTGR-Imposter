import { http, isOffline } from './http'
import { deviceId, sessionId } from './identity'

/**
 * Analytics-Adapter.
 *
 * Es werden ausschließlich anonyme Ereigniszähler übertragen. Spielernamen,
 * private Notizen, Wer-bin-ich-Begriffe und geheime Rollenansichten verlassen
 * das Gerät nie – siehe `AnalyticsPayload`, das nur Zahlen und feste Codes
 * zulässt.
 */

export type AnalyticsEventName =
  | 'app_session_start'
  | 'game_opened'
  | 'impostor_setup_opened'
  | 'impostor_setup_abandoned'
  | 'impostor_round_started'
  | 'impostor_round_completed'
  | 'impostor_term_drawn'
  | 'whoami_room_created'
  | 'whoami_room_joined'
  | 'whoami_round_started'
  | 'suggestion_submitted'

/** Nur Zahlen, Wahrheitswerte und geschlossene Codelisten – kein Freitext. */
export interface AnalyticsPayload {
  mode?: 'impostor' | 'whoami'
  playerCount?: number
  impostorCount?: number
  categories?: string[]
  termId?: string
  hintsEnabled?: boolean
  timerEnabled?: boolean
  online?: boolean
  roundsInSession?: number
}

interface QueuedEvent {
  name: AnalyticsEventName
  payload: AnalyticsPayload
  occurredAt: string
}

const queue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let enabled = true

async function flush(): Promise<void> {
  flushTimer = null
  if (!enabled || queue.length === 0 || isOffline()) return
  const batch = queue.splice(0, queue.length)
  try {
    await http.post('/analytics/events', {
      deviceId: deviceId(),
      sessionId: sessionId(),
      events: batch,
    })
  } catch {
    // Analytics dürfen das Spiel nie stören. Ereignisse zurücklegen und beim
    // nächsten Versuch erneut senden; bei Überlauf die ältesten verwerfen.
    queue.unshift(...batch)
    if (queue.length > 200) queue.splice(0, queue.length - 200)
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return
  flushTimer = setTimeout(() => void flush(), 3000)
}

export const analytics = {
  setEnabled(value: boolean): void {
    enabled = value
  },

  track(name: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
    if (!enabled) return
    queue.push({ name, payload, occurredAt: new Date().toISOString() })
    scheduleFlush()
  },

  /** Beim Verlassen der Seite die Warteschlange noch loswerden. */
  flushNow(): void {
    void flush()
  },
}

export function installAnalyticsLifecycle(): void {
  if (typeof document === 'undefined') return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') analytics.flushNow()
  })
  window.addEventListener('online', () => analytics.flushNow())
}
