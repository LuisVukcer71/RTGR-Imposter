import { getStore } from '../store'
import { cleanupExpiredRooms } from './roomService'

/**
 * Aufräumarbeiten ohne eigenen Cron: sie laufen gedrosselt im Hintergrund
 * regulärer Anfragen. Das passt zum Serverless-Modell von Vercel, wo kein
 * langlebiger Prozess existiert. Ein echter Cron-Job kann später denselben
 * Code über `/api/maintenance` aufrufen.
 */

const INTERVAL_MS = 5 * 60 * 1000
let lastRun = 0
let running = false

export async function runMaintenance(): Promise<{ roomsDeleted: number }> {
  const store = getStore()
  const roomsDeleted = await cleanupExpiredRooms(store.rooms)
  await store.rateLimit.purgeBefore(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  await store.admin.purgeExpiredSessions(new Date().toISOString())
  // Analytics werden bewusst niemals automatisch gelöscht.
  return { roomsDeleted }
}

/** Feuert höchstens alle fünf Minuten und blockiert die Anfrage nie. */
export function maybeRunMaintenance(): void {
  const now = Date.now()
  if (running || now - lastRun < INTERVAL_MS) return
  lastRun = now
  running = true
  void runMaintenance()
    .catch((error) => console.error('[maintenance] fehlgeschlagen:', error))
    .finally(() => {
      running = false
    })
}
