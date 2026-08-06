import { reactive, readonly } from 'vue'
import { loadJSON, saveJSON, isStorageAvailable } from '@/utils/storage'
import wordData from '@/data/words.json'
import type { WordCategory } from '@/types/game'

const STORAGE_KEY = 'imposter:custom-words'
export const MAX_WORD_LENGTH = 40
export const MAX_HINT_LENGTH = 140

interface CustomWordsPayload {
  categories: WordCategory[]
}

const staticCategories = wordData.categories as WordCategory[]

/** Ob localStorage tatsächlich schreibbar ist - einmalig beim Laden geprüft. */
const storageAvailable = isStorageAvailable()

const store = reactive<CustomWordsPayload>(
  storageAvailable ? loadJSON<CustomWordsPayload>(STORAGE_KEY, { categories: [] }) : { categories: [] },
)

function persist() {
  if (!storageAvailable) return
  saveJSON(STORAGE_KEY, { categories: store.categories } satisfies CustomWordsPayload)
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function findCustomCategory(name: string): WordCategory | undefined {
  return store.categories.find((c) => normalize(c.name) === normalize(name))
}

function staticWordsOf(categoryName: string): WordCategory['words'] {
  return staticCategories.find((c) => normalize(c.name) === normalize(categoryName))?.words ?? []
}

function isWordTaken(categoryName: string, word: string, ignoreWord?: string): boolean {
  const target = normalize(word)
  if (ignoreWord && normalize(ignoreWord) === target) return false

  const inStatic = staticWordsOf(categoryName).some((w) => normalize(w.word) === target)
  const inCustom = (findCustomCategory(categoryName)?.words ?? []).some((w) => normalize(w.word) === target)
  return inStatic || inCustom
}

function isValidInput(categoryName: string, word: string, hint: string): boolean {
  return (
    categoryName.trim().length > 0 &&
    word.trim().length > 0 &&
    word.trim().length <= MAX_WORD_LENGTH &&
    hint.trim().length > 0 &&
    hint.trim().length <= MAX_HINT_LENGTH
  )
}

export type CustomWordResult = 'ok' | 'duplicate' | 'invalid'

/** Fügt ein neues Wort+Hinweis-Paar hinzu; legt die Kategorie an, falls sie noch nicht existiert. */
function addCustomWord(categoryName: string, word: string, hint: string): CustomWordResult {
  const name = categoryName.trim()
  const trimmedWord = word.trim()
  const trimmedHint = hint.trim()

  if (!isValidInput(name, trimmedWord, trimmedHint)) return 'invalid'
  if (isWordTaken(name, trimmedWord)) return 'duplicate'

  let category = findCustomCategory(name)
  if (!category) {
    category = { name, words: [] }
    store.categories.push(category)
  }
  category.words.push({ word: trimmedWord, hint: trimmedHint })
  persist()
  return 'ok'
}

/** Bearbeitet ein bestehendes Custom-Word. Die Kategorie eines Eintrags bleibt dabei fix. */
function updateCustomWord(categoryName: string, originalWord: string, word: string, hint: string): CustomWordResult {
  const trimmedWord = word.trim()
  const trimmedHint = hint.trim()

  if (!isValidInput(categoryName, trimmedWord, trimmedHint)) return 'invalid'
  if (isWordTaken(categoryName, trimmedWord, originalWord)) return 'duplicate'

  const category = findCustomCategory(categoryName)
  const entry = category?.words.find((w) => normalize(w.word) === normalize(originalWord))
  if (!category || !entry) return 'invalid'

  entry.word = trimmedWord
  entry.hint = trimmedHint
  persist()
  return 'ok'
}

/** Entfernt ein Custom-Word; wird dadurch eine Kategorie leer, wird sie mit entfernt. */
function removeCustomWord(categoryName: string, word: string) {
  const category = findCustomCategory(categoryName)
  if (!category) return

  category.words = category.words.filter((w) => normalize(w.word) !== normalize(word))
  if (category.words.length === 0) {
    store.categories = store.categories.filter((c) => c !== category)
  }
  persist()
}

/** Für useWordSelection: Rohzugriff auf die Custom-Kategorien zum Zusammenführen mit words.json. */
export function getCustomCategories(): WordCategory[] {
  return store.categories
}

export function useCustomWords() {
  return {
    state: readonly(store),
    storageAvailable,
    addCustomWord,
    updateCustomWord,
    removeCustomWord,
  }
}
