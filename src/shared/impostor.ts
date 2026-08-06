import { IMPOSTOR } from './config'
import type {
  ImpostorAssignment,
  ImpostorConfig,
  ImpostorRole,
  PlayableTerm,
} from './types'
import { findDuplicateNames, validatePlayerName } from './validation'

/** Quelle für Zufall – in Tests durch eine deterministische Funktion ersetzbar. */
export type RandomFn = () => number

/**
 * Empfohlene Impostor-Anzahl laut Auftrag. Bewusst nur eine Empfehlung:
 * die Auswahl muss der Nutzer aktiv treffen.
 */
export function recommendedImpostorCount(playerCount: number): number {
  if (playerCount <= 5) return 1
  if (playerCount <= 9) return 2
  if (playerCount <= 14) return 3
  return 4
}

/** Obergrenze: mindestens ein normaler Spieler, ungefähr ein Impostor pro drei Spieler. */
export function maxImpostorCount(playerCount: number): number {
  const byRatio = Math.floor(playerCount / IMPOSTOR.playersPerImpostor)
  return Math.max(1, Math.min(byRatio, playerCount - 1))
}

export function impostorCountOptions(playerCount: number): number[] {
  const max = maxImpostorCount(playerCount)
  return Array.from({ length: max }, (_, index) => index + 1)
}

export function isValidImpostorCount(playerCount: number, impostorCount: number): boolean {
  if (!Number.isInteger(impostorCount)) return false
  if (impostorCount < 1) return false
  if (impostorCount > maxImpostorCount(playerCount)) return false
  return playerCount - impostorCount >= 1
}

export type ConfigProblem =
  | 'too_few_players'
  | 'too_many_players'
  | 'invalid_name'
  | 'duplicate_names'
  | 'no_category'
  | 'invalid_impostor_count'
  | 'timer_missing'

/** Sammelt alle Gründe, warum „Spiel starten“ deaktiviert bleibt. */
export function validateImpostorConfig(config: ImpostorConfig): ConfigProblem[] {
  const problems: ConfigProblem[] = []
  const names = config.playerNames

  if (names.length < IMPOSTOR.minPlayers) problems.push('too_few_players')
  if (names.length > IMPOSTOR.maxPlayers) problems.push('too_many_players')
  if (names.some((name) => !validatePlayerName(name).ok)) problems.push('invalid_name')
  if (findDuplicateNames(names).length > 0) problems.push('duplicate_names')
  if (config.categories.length === 0) problems.push('no_category')
  if (!isValidImpostorCount(names.length, config.impostorCount))
    problems.push('invalid_impostor_count')
  if (
    config.timerEnabled &&
    (config.timerSeconds === null ||
      config.timerSeconds < IMPOSTOR.minTimerSeconds ||
      config.timerSeconds > IMPOSTOR.maxTimerSeconds)
  )
    problems.push('timer_missing')

  return problems
}

/** Fisher-Yates auf einer Kopie. */
export function shuffle<T>(items: readonly T[], random: RandomFn = Math.random): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const a = result[i] as T
    const b = result[j] as T
    result[i] = b
    result[j] = a
  }
  return result
}

export function pickRandom<T>(items: readonly T[], random: RandomFn = Math.random): T | null {
  if (items.length === 0) return null
  return items[Math.floor(random() * items.length)] ?? null
}

/** Verteilt Rollen auf die Spieler in ihrer Eingabereihenfolge. */
export function assignRoles(
  playerNames: string[],
  impostorCount: number,
  random: RandomFn = Math.random,
): ImpostorAssignment[] {
  const indices = shuffle(
    playerNames.map((_, index) => index),
    random,
  )
  const impostorIndices = new Set(indices.slice(0, impostorCount))
  return playerNames.map((playerName, playerIndex) => {
    const role: ImpostorRole = impostorIndices.has(playerIndex) ? 'impostor' : 'crew'
    return { playerIndex, playerName, role }
  })
}

export interface DrawTermOptions {
  pool: readonly PlayableTerm[]
  categories: readonly string[]
  /** IDs, die in dieser Sitzung bereits gezogen wurden. */
  usedTermIds: readonly string[]
  random?: RandomFn
}

export interface DrawTermResult {
  term: PlayableTerm | null
  /** True, wenn der Pool erschöpft war und die Historie zurückgesetzt werden musste. */
  poolExhausted: boolean
}

/**
 * Zieht einen Begriff aus den gewählten Kategorien. Bereits verwendete Begriffe
 * werden übersprungen; erst wenn der relevante Pool erschöpft ist, sind
 * Wiederholungen erlaubt.
 */
export function drawTerm({
  pool,
  categories,
  usedTermIds,
  random = Math.random,
}: DrawTermOptions): DrawTermResult {
  const categorySet = new Set(categories)
  const candidates = pool.filter((term) => categorySet.has(term.category))
  if (candidates.length === 0) return { term: null, poolExhausted: false }

  const used = new Set(usedTermIds)
  const unused = candidates.filter((term) => !used.has(term.id))

  if (unused.length > 0) return { term: pickRandom(unused, random), poolExhausted: false }
  return { term: pickRandom(candidates, random), poolExhausted: true }
}

/** Namen der übrigen Impostor – nur relevant, wenn sie sich kennen sollen. */
export function fellowImpostors(
  assignments: readonly ImpostorAssignment[],
  playerIndex: number,
): string[] {
  return assignments
    .filter((a) => a.role === 'impostor' && a.playerIndex !== playerIndex)
    .map((a) => a.playerName)
}
