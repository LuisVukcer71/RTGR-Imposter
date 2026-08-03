<script setup lang="ts">
import { useRouter } from 'vue-router'
import ScreenLayout from '@/components/ui/ScreenLayout.vue'
import GameCard from '@/components/home/GameCard.vue'
import { GAMES, type GameDefinition } from '@/data/games'

const router = useRouter()

function goToGame(game: GameDefinition) {
  if (!game.routeName) return
  router.push({ name: game.routeName })
}
</script>

<template>
  <ScreenLayout wide>
    <header class="hero">
      <p class="hero__eyebrow">Spieleabend</p>
      <h1 class="hero__title">Was spielen wir heute?</h1>
      <p class="hero__subtitle">Ein Gerät, ein Abend, ein fester Freundeskreis.</p>
    </header>

    <div class="game-grid">
      <div
        v-for="(game, idx) in GAMES"
        :key="game.id"
        class="game-grid__item"
        :style="{ animationDelay: `${idx * 90}ms` }"
      >
        <GameCard :game="game" @select="goToGame" />
      </div>
    </div>
  </ScreenLayout>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: var(--space-6) 0 var(--space-3);
  animation: slide-up-fade var(--duration-slow) var(--ease-standard) both;
}

.hero__eyebrow {
  margin: 0;
  color: var(--color-blue-light);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.85rem;
}

.hero__title {
  margin: var(--space-2) 0 0;
  font-size: 2.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.hero__subtitle {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
}

.game-grid__item {
  animation: scale-in var(--duration-slow) var(--ease-emphasized) both;
}
</style>
