import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CATEGORIES } from '../shared/config.js'
import { renderModule } from '../../scripts/generate-seeds.js'
import { seedTerms } from './seedPool.js'

/**
 * `impostorSeedPool.ts` ist aus `impostor-seed-pool.json` erzeugt. Diese Tests
 * halten beide deckungsgleich und stellen sicher, dass der Startbestand nicht
 * versehentlich schrumpft.
 *
 * Der Umweg über ein Modul statt eines JSON-Imports ist kein Stilentscheid:
 * Vercel emittiert beim Kompilieren der Serverdateien keine JSON-Dateien, ein
 * Laufzeit-Import wäre dort nicht auflösbar.
 */

const jsonPath = fileURLToPath(new URL('./impostor-seed-pool.json', import.meta.url))
const modulePath = fileURLToPath(new URL('./impostorSeedPool.ts', import.meta.url))

describe('Seed-Pool', () => {
  it('enthält 350 Begriffe, exakt 50 pro Kategorie', () => {
    expect(seedTerms).toHaveLength(350)
    for (const category of CATEGORIES) {
      const count = seedTerms.filter((term) => term.category === category).length
      expect(count, `Kategorie ${category}`).toBe(50)
    }
  })

  it('hat keine doppelten IDs oder Begriffe je Kategorie', () => {
    expect(new Set(seedTerms.map((term) => term.id)).size).toBe(seedTerms.length)
    const byCategory = seedTerms.map((term) => `${term.category}::${term.displayTerm.toLowerCase()}`)
    expect(new Set(byCategory).size).toBe(seedTerms.length)
  })

  it('hat überall Anzeigebegriff, Bedeutung und Hinweiswort', () => {
    for (const term of seedTerms) {
      expect(term.displayTerm.trim(), term.id).not.toBe('')
      expect(term.canonicalTerm.trim(), term.id).not.toBe('')
      expect(term.hintTerm.trim(), term.id).not.toBe('')
      expect(term.hintTerm.toLowerCase(), term.id).not.toBe(term.displayTerm.toLowerCase())
    }
  })

  it('deckt sich mit der redaktionellen JSON-Quelle', () => {
    const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as Parameters<typeof renderModule>[0]
    expect(seedTerms).toEqual(raw)
  })

  it('ist nicht von Hand verändert worden', () => {
    const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as Parameters<typeof renderModule>[0]
    const expected = renderModule(raw)
    const actual = readFileSync(modulePath, 'utf8')
    expect(
      actual,
      'impostorSeedPool.ts weicht von der Quelle ab – `npm run seeds:generate` ausführen.',
    ).toBe(expected)
  })
})
