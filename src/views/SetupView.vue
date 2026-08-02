<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ScreenLayout from '@/components/ui/ScreenLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useGameState } from '@/composables/useGameState'
import { getAllCategoryNames } from '@/composables/useWordSelection'
import { loadJSON, saveJSON } from '@/utils/storage'
import type { Player } from '@/types/game'

const STORAGE_KEY = 'imposter:setup'
const MIN_PLAYERS = 3
const MAX_PLAYERS = 12

interface StoredSetup {
  playerCount: number
  names: string[]
  imposterCount: number
  categoryNames: string[]
}

const stored = loadJSON<StoredSetup>(STORAGE_KEY, {
  playerCount: 4,
  names: [],
  imposterCount: 1,
  categoryNames: [],
})

const router = useRouter()
const { configureGame, startGame } = useGameState()

const playerCount = ref(stored.playerCount)
const names = ref<string[]>(Array.from({ length: playerCount.value }, (_, i) => stored.names[i] ?? ''))
const imposterCount = ref(stored.imposterCount)
const allCategoryNames = getAllCategoryNames()
const selectedCategories = ref<string[]>(stored.categoryNames.filter((c) => allCategoryNames.includes(c)))

const maxImposters = computed(() => Math.max(playerCount.value - 2, 1))

watch(playerCount, (count) => {
  if (names.value.length < count) {
    names.value = [...names.value, ...Array.from({ length: count - names.value.length }, () => '')]
  } else {
    names.value = names.value.slice(0, count)
  }
  if (imposterCount.value > maxImposters.value) {
    imposterCount.value = maxImposters.value
  }
})

function changePlayerCount(delta: number) {
  playerCount.value = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, playerCount.value + delta))
}

function changeImposterCount(delta: number) {
  imposterCount.value = Math.min(maxImposters.value, Math.max(1, imposterCount.value + delta))
}

function toggleCategory(name: string) {
  const idx = selectedCategories.value.indexOf(name)
  if (idx === -1) {
    selectedCategories.value = [...selectedCategories.value, name]
  } else {
    selectedCategories.value = selectedCategories.value.filter((c) => c !== name)
  }
}

function startNewGame() {
  const players: Player[] = names.value.map((name, i) => ({
    id: i,
    name: name.trim() || `Spieler ${i + 1}`,
  }))

  saveJSON(STORAGE_KEY, {
    playerCount: playerCount.value,
    names: names.value,
    imposterCount: imposterCount.value,
    categoryNames: selectedCategories.value,
  } satisfies StoredSetup)

  configureGame(players, {
    playerCount: playerCount.value,
    imposterCount: imposterCount.value,
    categoryNames: selectedCategories.value,
  })
  startGame()
  router.push({ name: 'reveal' })
}
</script>

<template>
  <ScreenLayout>
    <header class="header">
      <h1 class="title">Impostor</h1>
      <p class="subtitle">Ein Wort. Eine Lüge. Wer fliegt auf?</p>
    </header>

    <AppCard class="section">
      <h2 class="section__title">Spieleranzahl</h2>
      <div class="stepper">
        <button
          class="stepper__btn"
          type="button"
          :disabled="playerCount <= MIN_PLAYERS"
          @click="changePlayerCount(-1)"
        >
          −
        </button>
        <span class="stepper__value">{{ playerCount }}</span>
        <button
          class="stepper__btn"
          type="button"
          :disabled="playerCount >= MAX_PLAYERS"
          @click="changePlayerCount(1)"
        >
          +
        </button>
      </div>
    </AppCard>

    <AppCard class="section">
      <h2 class="section__title">Namen <span class="optional">(optional)</span></h2>
      <div class="names">
        <input
          v-for="(_, i) in names"
          :key="i"
          v-model="names[i]"
          class="name-input"
          type="text"
          :placeholder="`Spieler ${i + 1}`"
          maxlength="20"
        />
      </div>
    </AppCard>

    <AppCard class="section">
      <h2 class="section__title">Anzahl Impostor</h2>
      <div class="stepper">
        <button class="stepper__btn" type="button" :disabled="imposterCount <= 1" @click="changeImposterCount(-1)">
          −
        </button>
        <span class="stepper__value">{{ imposterCount }}</span>
        <button
          class="stepper__btn"
          type="button"
          :disabled="imposterCount >= maxImposters"
          @click="changeImposterCount(1)"
        >
          +
        </button>
      </div>
    </AppCard>

    <AppCard class="section">
      <h2 class="section__title">Kategorien <span class="optional">(leer = alle)</span></h2>
      <div class="chips">
        <button
          v-for="name in allCategoryNames"
          :key="name"
          type="button"
          class="chip"
          :class="{ 'chip--active': selectedCategories.includes(name) }"
          @click="toggleCategory(name)"
        >
          {{ name }}
        </button>
      </div>
    </AppCard>

    <AppButton @click="startNewGame">Spiel starten</AppButton>
  </ScreenLayout>
</template>

<style scoped>
.header {
  text-align: center;
  margin-bottom: var(--space-2);
}

.title {
  font-size: 2.5rem;
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--color-accent);
}

.subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section__title {
  margin: 0;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.optional {
  text-transform: none;
  letter-spacing: normal;
  opacity: 0.7;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
}

.stepper__btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 1.4rem;
  cursor: pointer;
}

.stepper__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper__value {
  font-size: 1.8rem;
  font-weight: 700;
  min-width: 2ch;
  text-align: center;
}

.names {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.name-input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  color: var(--color-text);
  font-size: 1rem;
}

.name-input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -1px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  border-radius: 999px;
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  font-size: 0.9rem;
}

.chip--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-contrast);
  font-weight: 600;
}
</style>
