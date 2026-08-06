import wordData from '@/data/words.json'
import { getCustomCategories } from './useCustomWords'
import type { WordCategory } from '@/types/game'

const staticCategories = wordData.categories as WordCategory[]

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Kombiniert die statischen words.json-Kategorien mit den nutzerdefinierten
 * Custom-Words aus dem localStorage. Kategorien mit gleichem Namen werden
 * zusammengeführt, Wörter dabei case-insensitive dedupliziert.
 */
function getMergedCategories(): WordCategory[] {
  const merged = staticCategories.map((category) => ({
    name: category.name,
    words: [...category.words],
  }))

  for (const customCategory of getCustomCategories()) {
    const existing = merged.find((c) => normalize(c.name) === normalize(customCategory.name))

    if (existing) {
      const known = new Set(existing.words.map((w) => normalize(w.word)))
      for (const entry of customCategory.words) {
        if (!known.has(normalize(entry.word))) {
          existing.words.push(entry)
          known.add(normalize(entry.word))
        }
      }
    } else {
      merged.push({ name: customCategory.name, words: [...customCategory.words] })
    }
  }

  return merged
}

export function getAllCategoryNames(): string[] {
  return getMergedCategories().map((c) => c.name)
}

/**
 * Wählt zufällig eine Kategorie und ein Wort samt Hinweis. `allowedNames`
 * leer = alle Kategorien.
 */
export function pickCategoryAndWord(allowedNames: string[]): { categoryName: string; word: string; hint: string } {
  const categories = getMergedCategories()
  const pool = allowedNames.length > 0 ? categories.filter((c) => allowedNames.includes(c.name)) : categories

  const usablePool = pool.filter((c) => c.words.length > 0)
  const source = usablePool.length > 0 ? usablePool : categories.filter((c) => c.words.length > 0)

  const category = source[Math.floor(Math.random() * source.length)]!
  const entry = category.words[Math.floor(Math.random() * category.words.length)]!

  return { categoryName: category.name, word: entry.word, hint: entry.hint }
}
