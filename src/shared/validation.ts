import {
  CATEGORIES,
  PLAYER_NAME,
  SUGGESTIONS,
  WHO_AM_I,
  type CategoryName,
} from './config.js'

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; reason: string }

/** Zählt sichtbare Zeichen statt UTF-16-Einheiten, damit Emojis nicht doppelt zählen. */
export function visibleLength(value: string): number {
  return [...value].length
}

/**
 * Normalisiert einen Spielernamen: führende/nachgestellte Leerzeichen weg,
 * innere Leerzeichenfolgen zusammenziehen. Emojis und Unicode bleiben erhalten.
 */
export function normalizePlayerName(raw: string): string {
  return raw.replace(/\s+/gu, ' ').trim()
}

export function validatePlayerName(raw: string): ValidationResult<string> {
  const name = normalizePlayerName(raw)
  if (name.length === 0) return { ok: false, reason: 'empty' }
  const length = visibleLength(name)
  if (length < PLAYER_NAME.minLength) return { ok: false, reason: 'too_short' }
  if (length > PLAYER_NAME.maxLength) return { ok: false, reason: 'too_long' }
  return { ok: true, value: name }
}

/** Vergleichsschlüssel für die Duplikatprüfung – ohne Beachtung der Groß-/Kleinschreibung. */
export function playerNameKey(name: string): string {
  return normalizePlayerName(name).toLocaleLowerCase('de-DE')
}

export function findDuplicateNames(names: string[]): string[] {
  const seen = new Map<string, string>()
  const duplicates: string[] = []
  for (const name of names) {
    const key = playerNameKey(name)
    if (!key) continue
    if (seen.has(key)) {
      const first = seen.get(key)!
      if (!duplicates.includes(first)) duplicates.push(first)
    } else {
      seen.set(key, normalizePlayerName(name))
    }
  }
  return duplicates
}

export function hasDuplicateNames(names: string[]): boolean {
  return findDuplicateNames(names).length > 0
}

/* ------------------------------------------------------------------ */

export function normalizeTerm(raw: string): string {
  return raw.replace(/\s+/gu, ' ').trim()
}

export function validateWhoAmITerm(raw: string): ValidationResult<string> {
  const term = normalizeTerm(raw)
  if (term.length === 0) return { ok: false, reason: 'empty' }
  const length = visibleLength(term)
  if (length < WHO_AM_I.termMinLength) return { ok: false, reason: 'too_short' }
  if (length > WHO_AM_I.termMaxLength) return { ok: false, reason: 'too_long' }
  return { ok: true, value: term }
}

export function isCategoryName(value: unknown): value is CategoryName {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value)
}

export interface SuggestionInput {
  displayTerm: string
  canonicalTerm: string
  hintTerm: string
  category: string
  explanation?: string | null
}

export interface NormalizedSuggestion {
  displayTerm: string
  canonicalTerm: string
  hintTerm: string
  category: CategoryName
  explanation: string | null
}

export function validateSuggestion(
  input: SuggestionInput,
): ValidationResult<NormalizedSuggestion> {
  const displayTerm = normalizeTerm(input.displayTerm ?? '')
  const canonicalTerm = normalizeTerm(input.canonicalTerm ?? '')
  const hintTerm = normalizeTerm(input.hintTerm ?? '')
  const explanation = normalizeTerm(input.explanation ?? '')

  if (!displayTerm) return { ok: false, reason: 'displayTerm_empty' }
  if (visibleLength(displayTerm) > SUGGESTIONS.displayTermMaxLength)
    return { ok: false, reason: 'displayTerm_too_long' }
  if (!canonicalTerm) return { ok: false, reason: 'canonicalTerm_empty' }
  if (visibleLength(canonicalTerm) > SUGGESTIONS.canonicalTermMaxLength)
    return { ok: false, reason: 'canonicalTerm_too_long' }
  if (!hintTerm) return { ok: false, reason: 'hintTerm_empty' }
  if (visibleLength(hintTerm) > SUGGESTIONS.hintTermMaxLength)
    return { ok: false, reason: 'hintTerm_too_long' }
  if (!isCategoryName(input.category)) return { ok: false, reason: 'category_invalid' }
  if (visibleLength(explanation) > SUGGESTIONS.explanationMaxLength)
    return { ok: false, reason: 'explanation_too_long' }
  if (hintTerm.toLocaleLowerCase('de-DE') === displayTerm.toLocaleLowerCase('de-DE'))
    return { ok: false, reason: 'hint_equals_term' }

  return {
    ok: true,
    value: {
      displayTerm,
      canonicalTerm,
      hintTerm,
      category: input.category,
      explanation: explanation || null,
    },
  }
}

/* ------------------------------------------------------------------ */

const ROOM_CODE_PATTERN = new RegExp(
  `^[${WHO_AM_I.roomCodeAlphabet}]{${WHO_AM_I.roomCodeLength}}$`,
)

/**
 * Kleinschreibung, Leerzeichen und Bindestriche werden toleriert.
 * Verwechselbare Zeichen (O/0, I/1) kommen im Alphabet gar nicht erst vor,
 * deshalb wird hier bewusst nichts umgeschrieben – ein getipptes „0“ ist einfach ungültig.
 */
export function normalizeRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .slice(0, WHO_AM_I.roomCodeLength)
}

export function isValidRoomCode(code: string): boolean {
  return ROOM_CODE_PATTERN.test(code)
}
