<script setup lang="ts">
import { useRouter } from 'vue-router'
import ScreenLayout from '@/components/ui/ScreenLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCharacterPortrait from '@/components/ui/AppCharacterPortrait.vue'
import { useGameState } from '@/composables/useGameState'

const router = useRouter()
const { state, imposters, playAgain, resetGame } = useGameState()

function startAnotherRound() {
  playAgain()
  router.push({ name: 'impostor-reveal' })
}

function backToSetup() {
  resetGame()
  router.push({ name: 'impostor-setup' })
}
</script>

<template>
  <ScreenLayout v-if="state.round">
    <header class="header">
      <p class="eyebrow">Auflösung</p>
      <h1 class="title">{{ imposters.length > 1 ? 'Die Impostor waren' : 'Der Impostor war' }}</h1>
    </header>

    <AppCard tone="danger" class="imposters">
      <div class="imposters__list">
        <div
          v-for="(p, idx) in imposters"
          :key="p.id"
          class="imposter-entry"
          :style="{ animationDelay: `${260 + idx * 140}ms` }"
        >
          <AppCharacterPortrait
            :name="p.name"
            :character-src="p.characterSrc"
            :accent-color="p.accentColor"
            size="xl"
            role="imposter"
          />
          <p class="imposter-name">{{ p.name }}</p>
        </div>
      </div>
    </AppCard>

    <AppCard tone="success" class="word-card">
      <p class="word-card__eyebrow">{{ state.round.categoryName }}</p>
      <h2 class="word-card__word">{{ state.round.word }}</h2>
    </AppCard>

    <AppCard tone="info" class="hint-card">
      <p class="hint-card__eyebrow">Hinweis für den Impostor</p>
      <p class="hint-card__text">{{ state.round.hint }}</p>
    </AppCard>

    <div class="actions">
      <AppButton @click="startAnotherRound">Neue Runde</AppButton>
      <AppButton variant="secondary" @click="backToSetup">Zurück zum Setup</AppButton>
    </div>
  </ScreenLayout>
</template>

<style scoped>
.header {
  text-align: center;
  animation: slide-up-fade var(--duration-base) var(--ease-standard) both;
}

.eyebrow {
  margin: 0;
  color: var(--color-red-light);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
}

.title {
  margin: var(--space-1) 0 0;
  font-size: 1.8rem;
}

.imposters {
  text-align: center;
  --pulse-color: var(--color-red-glow);
  animation:
    slide-up-fade var(--duration-base) var(--ease-standard) 100ms both,
    pulse-glow 1.2s ease-in-out 650ms 2;
}

.imposters__list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.imposter-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  animation: scale-in var(--duration-slow) var(--ease-spring) both;
}

.imposter-name {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-red-light);
}

.word-card {
  text-align: center;
  --pulse-color: var(--color-green-glow);
  animation:
    slide-up-fade var(--duration-base) var(--ease-standard) 280ms both,
    pulse-glow 1.2s ease-in-out 900ms 2;
}

.word-card__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  color: var(--color-green-light);
}

.word-card__word {
  margin: var(--space-1) 0 0;
  font-size: 2rem;
  color: var(--color-text);
}

.hint-card {
  text-align: center;
  animation: slide-up-fade var(--duration-base) var(--ease-standard) 400ms both;
}

.hint-card__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  color: var(--color-blue-light);
}

.hint-card__text {
  margin: var(--space-1) 0 0;
  font-style: italic;
  color: var(--color-text);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  animation: slide-up-fade var(--duration-base) var(--ease-standard) 520ms both;
}
</style>
