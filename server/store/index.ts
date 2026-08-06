import { assertProductionReady, env } from '../env'
import { createMemoryStore } from './memory'
import { createPostgresStore } from './postgres'
import type { Store } from './types'

let instance: Store | null = null

/**
 * Liefert den konfigurierten Speicher. PostgreSQL sobald `DATABASE_URL` gesetzt
 * ist, sonst der flüchtige Adapter für lokale Entwicklung.
 */
export function getStore(): Store {
  if (instance) return instance
  assertProductionReady()
  instance = env.store === 'postgres' ? createPostgresStore() : createMemoryStore()
  if (instance.kind === 'memory') {
    console.warn(
      '[store] In-Memory-Speicher aktiv: Räume und Vorschläge überleben keinen Neustart. ' +
        'Für persistente Daten DATABASE_URL setzen.',
    )
  }
  return instance
}

/** Nur für Tests: erzwingt beim nächsten Zugriff eine frische Instanz. */
export function resetStore(next?: Store): void {
  instance = next ?? null
}

export type { Store } from './types'
