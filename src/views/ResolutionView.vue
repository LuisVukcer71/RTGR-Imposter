<script setup lang="ts">
import { useRouter } from 'vue-router'
import ScreenLayout from '@/components/ui/ScreenLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useGameState } from '@/composables/useGameState'

const router = useRouter()
const { state, imposters, playAgain, resetGame } = useGameState()

function startAnotherRound() {
  playAgain()
  router.push({ name: 'reveal' })
}

function backToSetup() {
  resetGame()
  router.push({ name: 'setup' })
}
</script>

<template>
  <ScreenLayout v-if="state.round">
    <header class="header">
      <p class="eyebrow">Auflösung</p>
      <h1 class="title">{{ imposters.length > 1 ? 'Die Impostor waren' : 'Der Impostor war' }}</h1>
    </header>

    <AppCard class="imposters">
      <p v-for="p in imposters" :key="p.id" class="imposter-name">{{ p.name }}</p>
    </AppCard>

    <AppCard class="word-card">
      <p class="word-card__eyebrow">{{ state.round.categoryName }}</p>
      <h2 class="word-card__word">{{ state.round.word }}</h2>
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
}

.eyebrow {
  margin: 0;
  color: var(--color-text-muted);
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
}

.imposter-name {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-danger);
}

.imposter-name + .imposter-name {
  margin-top: var(--space-2);
}

.word-card {
  text-align: center;
}

.word-card__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  color: var(--color-accent);
}

.word-card__word {
  margin: var(--space-1) 0 0;
  font-size: 2rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
