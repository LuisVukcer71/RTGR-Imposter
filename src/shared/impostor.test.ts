import { describe, expect, it } from 'vitest'
import { IMPOSTOR } from './config.js'
import {
  assignRoles,
  drawTerm,
  fellowImpostors,
  impostorCountOptions,
  isValidImpostorCount,
  maxImpostorCount,
  recommendedImpostorCount,
  shuffle,
  validateImpostorConfig,
} from './impostor.js'
import type { ImpostorConfig, PlayableTerm } from './types.js'

/** Deterministischer Ersatz für Math.random, damit Tests reproduzierbar sind. */
function sequence(values: number[]): () => number {
  let index = 0
  return () => values[index++ % values.length] as number
}

const pool: PlayableTerm[] = [
  { id: 'a1', displayTerm: 'Döner', hintTerm: 'Fast Food', category: 'Alltag' },
  { id: 'a2', displayTerm: 'Späti', hintTerm: 'Nacht-Einkauf', category: 'Alltag' },
  { id: 'g1', displayTerm: 'Fortnite', hintTerm: 'Battle Royale', category: 'Gaming' },
]

function config(overrides: Partial<ImpostorConfig> = {}): ImpostorConfig {
  return {
    playerNames: ['Tom', 'Lena', 'Mia'],
    impostorCount: 1,
    impostorsKnowEachOther: false,
    categories: ['Alltag'],
    hintsEnabled: true,
    timerEnabled: false,
    timerSeconds: null,
    ...overrides,
  }
}

describe('Impostor-Empfehlung', () => {
  it('folgt den Vorgaben aus dem Auftrag', () => {
    for (const count of [3, 4, 5]) expect(recommendedImpostorCount(count)).toBe(1)
    for (const count of [6, 7, 8, 9]) expect(recommendedImpostorCount(count)).toBe(2)
    for (const count of [10, 12, 14]) expect(recommendedImpostorCount(count)).toBe(3)
    for (const count of [15, 18, 20]) expect(recommendedImpostorCount(count)).toBe(4)
  })

  it('bleibt bei rund einem Impostor pro drei Spielern', () => {
    expect(maxImpostorCount(3)).toBe(1)
    expect(maxImpostorCount(9)).toBe(3)
    expect(maxImpostorCount(20)).toBe(6)
  })

  it('lässt immer mindestens einen normalen Spieler übrig', () => {
    for (let players = IMPOSTOR.minPlayers; players <= IMPOSTOR.maxPlayers; players++) {
      expect(players - maxImpostorCount(players)).toBeGreaterThanOrEqual(1)
    }
  })

  it('bietet nur gültige Auswahlmöglichkeiten an', () => {
    expect(impostorCountOptions(6)).toEqual([1, 2])
    for (const option of impostorCountOptions(11)) {
      expect(isValidImpostorCount(11, option)).toBe(true)
    }
  })

  it('weist ungültige Anzahlen ab', () => {
    expect(isValidImpostorCount(3, 0)).toBe(false)
    expect(isValidImpostorCount(3, 2)).toBe(false)
    expect(isValidImpostorCount(3, 1.5)).toBe(false)
  })
})

describe('Konfigurationsprüfung', () => {
  it('akzeptiert eine vollständige Konfiguration', () => {
    expect(validateImpostorConfig(config())).toEqual([])
  })

  it('erlaubt jede Spielerzahl von 3 bis 20', () => {
    for (let count = IMPOSTOR.minPlayers; count <= IMPOSTOR.maxPlayers; count++) {
      const names = Array.from({ length: count }, (_, index) => `Spieler ${index + 1}`)
      const problems = validateImpostorConfig(
        config({ playerNames: names, impostorCount: recommendedImpostorCount(count) }),
      )
      expect(problems, `bei ${count} Spielern`).toEqual([])
    }
  })

  it('blockiert zu wenige und zu viele Spieler', () => {
    expect(validateImpostorConfig(config({ playerNames: ['Tom', 'Lena'] }))).toContain(
      'too_few_players',
    )
    const tooMany = Array.from({ length: 21 }, (_, index) => `S${index}`)
    expect(validateImpostorConfig(config({ playerNames: tooMany }))).toContain('too_many_players')
  })

  it('blockiert doppelte Namen', () => {
    expect(validateImpostorConfig(config({ playerNames: ['Tom', 'tom', 'Mia'] }))).toContain(
      'duplicate_names',
    )
  })

  it('blockiert leere Namen', () => {
    expect(validateImpostorConfig(config({ playerNames: ['Tom', '', 'Mia'] }))).toContain(
      'invalid_name',
    )
  })

  it('verlangt mindestens eine Kategorie', () => {
    expect(validateImpostorConfig(config({ categories: [] }))).toContain('no_category')
  })

  it('verlangt eine aktiv gewählte Impostor-Anzahl', () => {
    expect(validateImpostorConfig(config({ impostorCount: -1 }))).toContain(
      'invalid_impostor_count',
    )
  })

  it('verlangt bei aktivem Timer eine gültige Dauer', () => {
    expect(validateImpostorConfig(config({ timerEnabled: true, timerSeconds: null }))).toContain(
      'timer_missing',
    )
    expect(validateImpostorConfig(config({ timerEnabled: true, timerSeconds: 300 }))).toEqual([])
  })
})

describe('Rollenverteilung', () => {
  it('verteilt genau so viele Impostor wie gewählt', () => {
    for (const count of [1, 2, 3]) {
      const assignments = assignRoles(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], count)
      expect(assignments.filter((a) => a.role === 'impostor')).toHaveLength(count)
      expect(assignments).toHaveLength(9)
    }
  })

  it('behält die Eingabereihenfolge der Spieler bei', () => {
    const names = ['Tom', 'Lena', 'Mia']
    const assignments = assignRoles(names, 1, sequence([0.1, 0.9, 0.4]))
    expect(assignments.map((a) => a.playerName)).toEqual(names)
    expect(assignments.map((a) => a.playerIndex)).toEqual([0, 1, 2])
  })

  it('nennt einem Impostor nur die anderen Impostor', () => {
    const assignments = [
      { playerIndex: 0, playerName: 'Tom', role: 'impostor' as const },
      { playerIndex: 1, playerName: 'Lena', role: 'crew' as const },
      { playerIndex: 2, playerName: 'Mia', role: 'impostor' as const },
    ]
    expect(fellowImpostors(assignments, 0)).toEqual(['Mia'])
    expect(fellowImpostors(assignments, 2)).toEqual(['Tom'])
  })

  it('mischt, ohne Elemente zu verlieren', () => {
    const input = [1, 2, 3, 4, 5]
    const shuffled = shuffle(input, sequence([0.9, 0.1, 0.5, 0.3]))
    expect([...shuffled].sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
})

describe('Begriffsziehung', () => {
  it('zieht nur aus den gewählten Kategorien', () => {
    const result = drawTerm({ pool, categories: ['Gaming'], usedTermIds: [] })
    expect(result.term?.id).toBe('g1')
  })

  it('wiederholt innerhalb der Sitzung keinen bereits gezogenen Begriff', () => {
    const result = drawTerm({ pool, categories: ['Alltag'], usedTermIds: ['a1'] })
    expect(result.term?.id).toBe('a2')
    expect(result.poolExhausted).toBe(false)
  })

  it('erlaubt Wiederholungen erst, wenn der Pool erschöpft ist', () => {
    const result = drawTerm({ pool, categories: ['Alltag'], usedTermIds: ['a1', 'a2'] })
    expect(result.term).not.toBeNull()
    expect(result.poolExhausted).toBe(true)
  })

  it('liefert null, wenn es für die Kategorien keine Begriffe gibt', () => {
    const result = drawTerm({ pool, categories: ['Berufe'], usedTermIds: [] })
    expect(result.term).toBeNull()
  })
})
