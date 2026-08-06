import { seedTerms } from '@/data/seedPool'
import type { PlayableTerm, TermPool } from '@shared/types'
import { http } from './http'
import { storage, StorageKeys } from './storage'

/**
 * Wortpool mit Online-Vorrang und belastbarem Offline-Fallback.
 *
 * Reihenfolge: Server → zuletzt erfolgreich gecachter Serverstand → gebündelte
 * Seeds. Impostor bleibt dadurch auch ohne Internet vollständig spielbar.
 */

const bundledPool: TermPool = {
  version: 0,
  fetchedAt: new Date(0).toISOString(),
  source: 'bundled',
  terms: seedTerms
    .filter((term) => term.enabled)
    .map(({ id, displayTerm, hintTerm, category }) => ({ id, displayTerm, hintTerm, category })),
}

function readCache(): TermPool | null {
  const cached = storage.get<TermPool | null>(StorageKeys.termPool, null)
  if (!cached || !Array.isArray(cached.terms) || cached.terms.length === 0) return null
  return { ...cached, source: 'server' }
}

export function cachedOrBundledPool(): TermPool {
  return readCache() ?? bundledPool
}

export function getBundledPool(): TermPool {
  return bundledPool
}

export interface LoadPoolResult {
  pool: TermPool
  /** True, wenn der Server nicht erreichbar war und lokale Daten genutzt werden. */
  usedFallback: boolean
}

interface TermsResponse {
  version: number
  terms: PlayableTerm[]
}

/**
 * Lädt den aktiven Pool vom Server und cached ihn. Schlägt das fehl, wird
 * transparent auf Cache bzw. Seeds zurückgefallen – ohne Fehler nach außen.
 */
export async function loadTermPool(signal?: AbortSignal): Promise<LoadPoolResult> {
  try {
    const response = await http.get<TermsResponse>('/terms', { signal, timeoutMs: 8000 })
    if (!response?.terms?.length) throw new Error('empty_pool')
    const pool: TermPool = {
      version: response.version,
      fetchedAt: new Date().toISOString(),
      source: 'server',
      terms: response.terms,
    }
    storage.set(StorageKeys.termPool, pool)
    return { pool, usedFallback: false }
  } catch {
    return { pool: cachedOrBundledPool(), usedFallback: true }
  }
}

/* --- Verbrauchte Begriffe je Sitzung ------------------------------- */

export function usedTermIds(): string[] {
  return storage.get<string[]>(StorageKeys.impostorUsedTerms, [])
}

export function markTermUsed(termId: string): void {
  const used = usedTermIds()
  if (used.includes(termId)) return
  used.push(termId)
  storage.set(StorageKeys.impostorUsedTerms, used)
}

export function resetUsedTerms(): void {
  storage.remove(StorageKeys.impostorUsedTerms)
}

export function countTermsInCategories(pool: TermPool, categories: readonly string[]): number {
  const set = new Set(categories)
  return pool.terms.reduce((total, term) => (set.has(term.category) ? total + 1 : total), 0)
}
