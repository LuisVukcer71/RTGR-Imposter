<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ScreenLayout from '@/components/ui/ScreenLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getAllCategoryNames } from '@/composables/useWordSelection'
import { useCustomWords, MAX_WORD_LENGTH, MAX_HINT_LENGTH, type CustomWordResult } from '@/composables/useCustomWords'
import type { WordEntry } from '@/types/game'

const router = useRouter()
const { state, storageAvailable, addCustomWord, updateCustomWord, removeCustomWord } = useCustomWords()

const allCategoryNames = computed(() => getAllCategoryNames())

const categoryInput = ref('')
const wordInput = ref('')
const hintInput = ref('')

const editing = ref<{ categoryName: string; originalWord: string } | null>(null)
const formStatus = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const pendingDeleteKey = ref<string | null>(null)

function resetForm() {
  categoryInput.value = ''
  wordInput.value = ''
  hintInput.value = ''
  editing.value = null
}

function scrollFieldIntoView(event: FocusEvent) {
  ;(event.target as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' })
}

function messageFor(result: CustomWordResult, mode: 'add' | 'update'): { type: 'success' | 'error'; text: string } {
  if (result === 'ok') {
    return { type: 'success', text: mode === 'add' ? 'Wort hinzugefügt.' : 'Wort aktualisiert.' }
  }
  if (result === 'duplicate') {
    return { type: 'error', text: 'Dieses Wort gibt es in dieser Kategorie bereits.' }
  }
  return {
    type: 'error',
    text: `Bitte Kategorie, Wort (max. ${MAX_WORD_LENGTH} Zeichen) und Hinweis (max. ${MAX_HINT_LENGTH} Zeichen) ausfüllen.`,
  }
}

function submitForm() {
  if (editing.value) {
    const result = updateCustomWord(editing.value.categoryName, editing.value.originalWord, wordInput.value, hintInput.value)
    formStatus.value = messageFor(result, 'update')
    if (result === 'ok') resetForm()
    return
  }

  const result = addCustomWord(categoryInput.value, wordInput.value, hintInput.value)
  formStatus.value = messageFor(result, 'add')
  if (result === 'ok') {
    wordInput.value = ''
    hintInput.value = ''
  }
}

function startEdit(categoryName: string, entry: WordEntry) {
  editing.value = { categoryName, originalWord: entry.word }
  categoryInput.value = categoryName
  wordInput.value = entry.word
  hintInput.value = entry.hint
  formStatus.value = null
}

function cancelEdit() {
  resetForm()
  formStatus.value = null
}

function deleteKey(categoryName: string, word: string): string {
  return `${categoryName}::${word}`
}

function requestDelete(categoryName: string, word: string) {
  const key = deleteKey(categoryName, word)

  if (pendingDeleteKey.value === key) {
    removeCustomWord(categoryName, word)
    if (editing.value && editing.value.categoryName === categoryName && editing.value.originalWord === word) {
      resetForm()
    }
    pendingDeleteKey.value = null
    return
  }

  pendingDeleteKey.value = key
  window.setTimeout(() => {
    if (pendingDeleteKey.value === key) pendingDeleteKey.value = null
  }, 3000)
}

function goBack() {
  router.push({ name: 'impostor-setup' })
}
</script>

<template>
  <ScreenLayout>
    <div class="top-bar">
      <button type="button" class="back-btn glass-surface glass-surface--interactive" @click="goBack">←</button>
    </div>

    <header class="header">
      <h1 class="title">Wörter verwalten</h1>
      <p class="subtitle">Eigene Wort-Hinweis-Paare für deine Kategorien anlegen.</p>
    </header>

    <AppCard v-if="!storageAvailable" tone="danger" class="storage-warning">
      Lokaler Speicher ist auf diesem Gerät nicht verfügbar (z. B. privater Modus). Eigene Wörter funktionieren nur
      für diese Sitzung und gehen beim Schließen der App verloren.
    </AppCard>

    <AppCard class="section section--form">
      <h2 class="section__title">{{ editing ? 'Wort bearbeiten' : 'Neues Wort anlegen' }}</h2>

      <form class="word-form" @submit.prevent="submitForm">
        <label class="field">
          <span class="field__label">Kategorie</span>
          <input
            v-model="categoryInput"
            class="field__input"
            type="text"
            list="category-options"
            placeholder="Bestehende wählen oder neue eingeben"
            :disabled="editing !== null"
            maxlength="40"
            autocomplete="off"
            @focus="scrollFieldIntoView"
          />
          <datalist id="category-options">
            <option v-for="name in allCategoryNames" :key="name" :value="name" />
          </datalist>
        </label>

        <label class="field">
          <span class="field__label">Wort</span>
          <input
            v-model="wordInput"
            class="field__input"
            type="text"
            placeholder="z. B. Kaffee"
            :maxlength="MAX_WORD_LENGTH"
            autocomplete="off"
            @focus="scrollFieldIntoView"
          />
        </label>

        <label class="field">
          <span class="field__label">Hinweis für den Impostor</span>
          <textarea
            v-model="hintInput"
            class="field__input field__input--textarea"
            rows="2"
            placeholder="z. B. Wird morgens heiß getrunken und hält wach"
            :maxlength="MAX_HINT_LENGTH"
            @focus="scrollFieldIntoView"
          />
        </label>

        <Transition name="fade-slide-up">
          <p v-if="formStatus" class="form-status" :class="`form-status--${formStatus.type}`">
            {{ formStatus.text }}
          </p>
        </Transition>

        <div class="form-actions">
          <AppButton type="submit">{{ editing ? 'Speichern' : 'Hinzufügen' }}</AppButton>
          <AppButton v-if="editing" variant="ghost" type="button" @click="cancelEdit">Abbrechen</AppButton>
        </div>
      </form>
    </AppCard>

    <AppCard v-if="state.categories.length === 0" class="section section--empty">
      <p class="empty-text">Noch keine eigenen Wörter angelegt.</p>
    </AppCard>

    <AppCard v-for="category in state.categories" :key="category.name" class="section section--list">
      <h2 class="section__title">
        {{ category.name }} <span class="counter">{{ category.words.length }}</span>
      </h2>

      <ul class="word-list">
        <li v-for="entry in category.words" :key="entry.word" class="word-row">
          <div class="word-row__text">
            <p class="word-row__word">{{ entry.word }}</p>
            <p class="word-row__hint">{{ entry.hint }}</p>
          </div>
          <div class="word-row__actions">
            <button
              type="button"
              class="icon-btn glass-surface glass-surface--interactive"
              aria-label="Wort bearbeiten"
              @click="startEdit(category.name, entry)"
            >
              ✎
            </button>
            <button
              type="button"
              class="icon-btn glass-surface glass-surface--interactive"
              :class="{ 'icon-btn--danger': pendingDeleteKey === deleteKey(category.name, entry.word) }"
              :aria-label="
                pendingDeleteKey === deleteKey(category.name, entry.word) ? 'Löschen bestätigen' : 'Wort löschen'
              "
              @click="requestDelete(category.name, entry.word)"
            >
              {{ pendingDeleteKey === deleteKey(category.name, entry.word) ? '⚠' : '✕' }}
            </button>
          </div>
        </li>
      </ul>
    </AppCard>
  </ScreenLayout>
</template>

<style scoped>
.top-bar {
  animation: fade-in var(--duration-base) ease both;
}

.back-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  color: var(--color-text);
  font-size: 1.2rem;
  cursor: pointer;
}

.header {
  text-align: center;
  margin-bottom: var(--space-2);
  animation: slide-up-fade var(--duration-base) var(--ease-standard) both;
}

.title {
  font-size: 2rem;
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--color-blue);
}

.subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
}

.storage-warning {
  color: var(--color-red-light);
  font-size: 0.9rem;
  animation: slide-up-fade var(--duration-base) var(--ease-standard) both;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  animation: slide-up-fade var(--duration-base) var(--ease-standard) both;
}

.section__title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.counter {
  text-transform: none;
  letter-spacing: normal;
  color: var(--color-blue-light);
  font-weight: 600;
}

.word-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field__label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.field__input {
  min-height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--glass-bg);
  color: var(--color-text);
  padding: var(--space-2) var(--space-3);
  font-size: 1rem;
  font-family: inherit;
  resize: none;
}

.field__input:focus {
  outline: none;
  border-color: var(--color-blue);
}

.field__input--textarea {
  min-height: 64px;
  padding-top: var(--space-2);
}

.form-status {
  margin: 0;
  font-size: 0.9rem;
}

.form-status--success {
  color: var(--color-green-light);
}

.form-status--error {
  color: var(--color-red-light);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
}

.empty-text {
  margin: 0;
  color: var(--color-text-muted);
  text-align: center;
}

.word-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.word-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.word-row__text {
  min-width: 0;
}

.word-row__word {
  margin: 0;
  font-weight: 600;
  color: var(--color-text);
}

.word-row__hint {
  margin: var(--space-1) 0 0;
  font-style: italic;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  overflow-wrap: break-word;
}

.word-row__actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  color: var(--color-text);
  font-size: 1.1rem;
  cursor: pointer;
}

.icon-btn--danger {
  color: var(--color-red-light);
  box-shadow:
    var(--glass-shadow-ambient),
    var(--glass-shadow-contact),
    0 0 0 1px var(--color-red-alpha),
    0 0 20px 2px var(--color-red-glow);
}

.fade-slide-up-enter-active {
  transition:
    opacity var(--duration-base) ease,
    transform var(--duration-base) var(--ease-standard);
}

.fade-slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-up-leave-active {
  transition: opacity var(--duration-fast) ease;
}

.fade-slide-up-leave-to {
  opacity: 0;
}
</style>
