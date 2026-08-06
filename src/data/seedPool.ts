import type { CategoryName, ReviewStatus } from '@shared/config'
import type { ImpostorTerm } from '@shared/types'
import raw from './impostor-seed-pool.json'

/**
 * Der verbindliche Startbestand: 350 kuratierte Begriffe, exakt 50 pro Kategorie.
 *
 * Die Datei wird an zwei Stellen gebraucht:
 *  - vom Seed-Skript für den Import in PostgreSQL,
 *  - vom Client als Offline-Fallback, damit Impostor ohne Internet spielbar ist.
 */

interface RawSeed {
  id: string
  displayTerm: string
  canonicalTerm: string
  hintTerm: string
  category: string
  enabled: boolean
  reviewStatus: string
}

export const seedTerms: ImpostorTerm[] = (raw as RawSeed[]).map((entry) => ({
  id: entry.id,
  displayTerm: entry.displayTerm,
  canonicalTerm: entry.canonicalTerm,
  hintTerm: entry.hintTerm,
  category: entry.category as CategoryName,
  enabled: entry.enabled,
  reviewStatus: entry.reviewStatus as ReviewStatus,
}))
