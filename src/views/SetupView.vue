<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ScreenLayout from '@/components/ui/ScreenLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import { useGameState } from '@/composables/useGameState'
import { getAllCategoryNames } from '@/composables/useWordSelection'
import { loadJSON, saveJSON } from '@/utils/storage'
import { PLAYER_PROFILES } from '@/data/players'
import type { Player } from '@/types/game'

const STORAGE_KEY = 'imposter:setup'
const MIN_PLAYERS = 3
const MAX_PLAYERS = PLAYER_PROFILES.length

interface StoredSetup {
  selectedIds: string[]
  imposterCount: number
  categoryNames: string[]
}

const validProfileIds = new Set(PLAYER_PROFILES.map((p) => p.id))

const stored = loadJSON<StoredSetup>(STORAGE_KEY, {
  selectedIds: [],
  imposterCount: 1,
  categoryNames: [],
})

const router = useRouter()
const { configureGame, startGame } = useGameState()

const selectedIds = ref<string[]>(stored.selectedIds.filter((id) => validProfileIds.has(id)))
const imposterCount = ref(stored.imposterCount)
const allCategoryNames = getAllCategoryNames()
const selectedCategories = ref<string[]>(stored.categoryNames.filter((c) => allCategoryNames.includes(c)))

const maxImposters = computed(() => Math.max(selectedIds.value.length - 2, 1))
const isSelectionFull = computed(() => selectedIds.value.length >= MAX_PLAYERS)
const canStart = computed(() => selectedIds.value.length >= MIN_PLAYERS)

watch(
  () => selectedIds.value.length,
  () => {
    if (imposterCount.value > maxImposters.value) {
      imposterCount.value = maxImposters.value
    }
  },
)

function toggleProfile(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((existing) => existing !== id)
  } else if (!isSelectionFull.value) {
    selectedIds.value = [...selectedIds.value, id]
  }
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

function goHome() {
  router.push({ name: 'home' })
}

function startNewGame() {
  const players: Player[] = PLAYER_PROFILES.filter((profile) => selectedIds.value.includes(profile.id)).map(
    (profile, i) => ({
      id: i,
      name: profile.name,
      avatarSrc: profile.avatarSrc,
      characterSrc: profile.avatarSrc,
      accentColor: profile.accentColor,
    }),
  )

  saveJSON(STORAGE_KEY, {
    selectedIds: selectedIds.value,
    imposterCount: imposterCount.value,
    categoryNames: selectedCategories.value,
  } satisfies StoredSetup)

  configureGame(players, {
    playerCount: players.length,
    imposterCount: imposterCount.value,
    categoryNames: selectedCategories.value,
  })
  startGame()
  router.push({ name: 'impostor-reveal' })
}
</script>

<template>
  <ScreenLayout>
    <div class="top-bar">
      <button type="button" class="back-btn glass-surface glass-surface--interactive" @click="goHome">←</button>
    </div>

    <header class="header">
      <h1 class="title">Impostor</h1>
      <p class="subtitle">Ein Wort. Eine Lüge. Wer fliegt auf?</p>
    </header>

    <AppCard class="section section--players">
      <h2 class="section__title">
        Spieler <span class="counter">{{ selectedIds.length }} ausgewählt</span>
      </h2>
      <div class="player-grid">
        <button
          v-for="(profile, idx) in PLAYER_PROFILES"
          :key="profile.id"
          type="button"
          class="player-tile"
          :class="{ 'player-tile--disabled': !selectedIds.includes(profile.id) && isSelectionFull }"
          :style="{ animationDelay: `${idx * 50}ms` }"
          @click="toggleProfile(profile.id)"
        >
          <AppAvatar
            :name="profile.name"
            :avatar-src="profile.avatarSrc"
            :accent-color="profile.accentColor"
            size="lg"
            :selected="selectedIds.includes(profile.id)"
          />
          <span class="player-tile__name">{{ profile.name }}</span>
        </button>
      </div>
    </AppCard>

    <AppCard class="section section--imposters">
      <h2 class="section__title">Anzahl Impostor</h2>
      <div class="stepper">
        <button class="stepper__btn" type="button" :disabled="imposterCount <= 1" @click="changeImposterCount(-1)">
          −
        </button>
        <span class="stepper__value-wrap">
          <Transition name="number-swap">
            <span class="stepper__value" :key="imposterCount">{{ imposterCount }}</span>
          </Transition>
        </span>
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

    <AppCard class="section section--categories">
      <h2 class="section__title">Kategorien <span class="optional">(leer = alle)</span></h2>
      <TransitionGroup name="chip-pop" tag="div" class="chips" appear>
        <button
          v-for="(name, idx) in allCategoryNames"
          :key="name"
          type="button"
          class="chip glass-surface glass-surface--interactive"
          :class="{ 'chip--active': selectedCategories.includes(name) }"
          :style="{ animationDelay: `${idx * 60}ms` }"
          @click="toggleCategory(name)"
        >
          {{ name }}
        </button>
      </TransitionGroup>
    </AppCard>

    <div class="cta">
      <AppButton :disabled="!canStart" @click="startNewGame">Spiel starten</AppButton>
    </div>
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
  font-size: 2.5rem;
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--color-blue);
}

.subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  animation: slide-up-fade var(--duration-base) var(--ease-standard) both;
}

.section--players {
  animation-delay: 60ms;
}

.section--imposters {
  animation-delay: 160ms;
}

.section--categories {
  animation-delay: 220ms;
}

.cta {
  animation: slide-up-fade var(--duration-base) var(--ease-standard) 280ms both;
}

.section__title {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.optional {
  text-transform: none;
  letter-spacing: normal;
  opacity: 0.7;
}

.player-grid {
  display: grid;
  /* minmax(0, 1fr) statt bare 1fr: verhindert, dass Spuren durch den
     Content (76px-Avatar, flex-shrink:0) über die verfügbare Breite hinaus
     aufgeblasen werden - sonst überläuft das Grid die Karte auf 320-430px
     breiten Handys und wird von .app-shell{overflow:hidden} abgeschnitten. */
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

@media (max-width: 340px) {
  .player-grid {
    /* Auf sehr schmalen Geräten (<=340px) reicht selbst der geschrumpfte
       Avatar nicht mehr sauber für 4 Spalten - auf 3 reflowen statt quetschen. */
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.player-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  animation: scale-in var(--duration-base) var(--ease-standard) both;
  transition:
    opacity var(--duration-base) ease,
    transform var(--duration-fast) var(--ease-standard);
}

.player-tile:active {
  transform: scale(0.94);
}

.player-tile--disabled {
  opacity: 0.35;
  pointer-events: none;
}

.player-tile__name {
  font-size: 0.8rem;
  color: var(--color-text-muted);
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
  background: var(--glass-bg-strong);
  color: var(--color-text);
  font-size: 1.4rem;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-standard),
    background-color var(--duration-base) ease,
    border-color var(--duration-base) ease;
}

.stepper__btn:hover:not(:disabled) {
  border-color: var(--color-blue);
}

.stepper__btn:active:not(:disabled) {
  transform: scale(0.9);
}

.stepper__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper__value-wrap {
  position: relative;
  display: inline-flex;
  justify-content: center;
  min-width: 2.4ch;
  height: 2.2rem;
  overflow: hidden;
}

.stepper__value {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 2.2rem;
  text-align: center;
}

.number-swap-enter-active,
.number-swap-leave-active {
  position: absolute;
  inset: 0;
  transition:
    transform var(--duration-fast) var(--ease-standard),
    opacity var(--duration-fast) ease;
}

.number-swap-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.number-swap-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip-pop-enter-active {
  animation: scale-in var(--duration-base) var(--ease-standard) both;
}

.chip {
  border: none;
  color: var(--color-text-muted);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-3);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
}

.chip.chip--active {
  color: var(--color-blue-light);
  font-weight: 600;
  box-shadow:
    var(--glass-shadow-ambient),
    var(--glass-shadow-contact),
    0 0 0 1px var(--color-blue-alpha),
    0 0 20px 2px var(--color-blue-glow);
  animation: pop 0.3s var(--ease-standard);
}
</style>
