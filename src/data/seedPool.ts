import type { CategoryName, ReviewStatus } from '../shared/config.js'
import type { ImpostorTerm } from '../shared/types.js'
// Das Import-Attribut ist in Node-ESM Pflicht. Es hält den Import zugleich
// statisch analysierbar, sodass Vercels File-Tracing die JSON-Datei mit in die
// Function packt – anders als ein Laden über fs zur Laufzeit.
import raw from './impostor-seed-pool.json' with { type: 'json' }

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
