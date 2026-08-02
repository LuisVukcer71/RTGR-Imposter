import wordData from '@/data/words.json'

export interface Category {
  name: string
  words: string[]
}

const categories = wordData.categories as Category[]

export function getAllCategoryNames(): string[] {
  return categories.map((c) => c.name)
}

/**
 * Wählt zufällig eine Kategorie und ein Wort. `allowedNames` leer = alle Kategorien.
 */
export function pickCategoryAndWord(allowedNames: string[]): { categoryName: string; word: string } {
  const pool = allowedNames.length > 0 ? categories.filter((c) => allowedNames.includes(c.name)) : categories

  const usablePool = pool.filter((c) => c.words.length > 0)
  const source = usablePool.length > 0 ? usablePool : categories.filter((c) => c.words.length > 0)

  const category = source[Math.floor(Math.random() * source.length)]!
  const word = category.words[Math.floor(Math.random() * category.words.length)]!

  return { categoryName: category.name, word }
}
