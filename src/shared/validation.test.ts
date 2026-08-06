import { describe, expect, it } from 'vitest'
import { PLAYER_NAME, WHO_AM_I } from './config'
import {
  findDuplicateNames,
  hasDuplicateNames,
  isValidRoomCode,
  normalizePlayerName,
  normalizeRoomCode,
  validatePlayerName,
  validateSuggestion,
  validateWhoAmITerm,
  visibleLength,
} from './validation'

describe('Spielernamen', () => {
  it('trimmt außen und zieht innere Leerzeichen zusammen', () => {
    expect(normalizePlayerName('  Lena   Maria  ')).toBe('Lena Maria')
  })

  it('erlaubt Leerzeichen innerhalb des Namens', () => {
    expect(validatePlayerName('Anna Lena')).toEqual({ ok: true, value: 'Anna Lena' })
  })

  it('erlaubt Unicode und Emojis', () => {
    expect(validatePlayerName('Jörg 🐙')).toEqual({ ok: true, value: 'Jörg 🐙' })
  })

  it('zählt Emojis als ein sichtbares Zeichen', () => {
    expect(visibleLength('🐙')).toBe(1)
    // 20 Emojis liegen genau auf der Grenze, 21 darüber.
    expect(validatePlayerName('🐙'.repeat(PLAYER_NAME.maxLength)).ok).toBe(true)
    expect(validatePlayerName('🐙'.repeat(PLAYER_NAME.maxLength + 1)).ok).toBe(false)
  })

  it('verbietet reine Leerzeichen', () => {
    expect(validatePlayerName('   ')).toEqual({ ok: false, reason: 'empty' })
  })

  it('verbietet mehr als 20 sichtbare Zeichen', () => {
    expect(validatePlayerName('a'.repeat(21))).toEqual({ ok: false, reason: 'too_long' })
  })
})

describe('Duplikatprüfung', () => {
  it('ignoriert Groß- und Kleinschreibung', () => {
    expect(hasDuplicateNames(['Lena', 'LENA'])).toBe(true)
  })

  it('ignoriert unterschiedliche Leerzeichensetzung', () => {
    expect(hasDuplicateNames(['Anna  Lena', 'anna lena'])).toBe(true)
  })

  it('nennt den zuerst eingetragenen Namen als Duplikat', () => {
    expect(findDuplicateNames(['Tom', 'Lena', 'tom'])).toEqual(['Tom'])
  })

  it('meldet unterschiedliche Namen nicht', () => {
    expect(hasDuplicateNames(['Tom', 'Lena', 'Mia'])).toBe(false)
  })

  it('ignoriert leere Felder', () => {
    expect(hasDuplicateNames(['', '', 'Tom'])).toBe(false)
  })
})

describe('Raumcodes', () => {
  it('akzeptiert nur Codes aus dem Alphabet', () => {
    expect(isValidRoomCode('K7M4PX')).toBe(true)
    expect(isValidRoomCode('K7M4P')).toBe(false)
    expect(isValidRoomCode('k7m4px')).toBe(false)
  })

  it('enthält keine verwechselbaren Zeichen', () => {
    for (const char of ['O', '0', 'I', '1']) {
      expect(WHO_AM_I.roomCodeAlphabet).not.toContain(char)
    }
  })

  it('toleriert Kleinschreibung, Leerzeichen und Bindestriche', () => {
    expect(normalizeRoomCode(' k7m-4px ')).toBe('K7M4PX')
  })

  it('lehnt einen Code mit verwechselbaren Zeichen ab, statt ihn stillschweigend umzudeuten', () => {
    expect(isValidRoomCode(normalizeRoomCode('K7M4P0'))).toBe(false)
  })
})

describe('Wer-bin-ich-Begriffe', () => {
  it('normalisiert und akzeptiert gültige Begriffe', () => {
    expect(validateWhoAmITerm('  Elon   Musk ')).toEqual({ ok: true, value: 'Elon Musk' })
  })

  it('lehnt leere Eingaben ab', () => {
    expect(validateWhoAmITerm('   ').ok).toBe(false)
  })

  it('lehnt zu lange Eingaben ab', () => {
    expect(validateWhoAmITerm('a'.repeat(WHO_AM_I.termMaxLength + 1)).ok).toBe(false)
  })
})

describe('Wortvorschläge', () => {
  const valid = {
    displayTerm: 'Big Yahu',
    canonicalTerm: 'Benjamin Netanyahu',
    hintTerm: 'Israel',
    category: 'Promis',
  }

  it('akzeptiert einen vollständigen Vorschlag', () => {
    const result = validateSuggestion(valid)
    expect(result.ok).toBe(true)
  })

  it('verlangt eine bekannte Kategorie', () => {
    expect(validateSuggestion({ ...valid, category: 'Erfunden' })).toEqual({
      ok: false,
      reason: 'category_invalid',
    })
  })

  it('verbietet ein Hinweiswort, das dem Begriff entspricht', () => {
    expect(validateSuggestion({ ...valid, hintTerm: 'big yahu' })).toEqual({
      ok: false,
      reason: 'hint_equals_term',
    })
  })

  it('verlangt eine kanonische Bedeutung', () => {
    expect(validateSuggestion({ ...valid, canonicalTerm: '  ' })).toEqual({
      ok: false,
      reason: 'canonicalTerm_empty',
    })
  })
})
