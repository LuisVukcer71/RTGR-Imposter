<script setup lang="ts">
import type { GameDefinition } from '@/data/games'

const props = defineProps<{
  game: GameDefinition
}>()

const emit = defineEmits<{ select: [game: GameDefinition] }>()

function onClick() {
  if (props.game.status !== 'available') return
  emit('select', props.game)
}
</script>

<template>
  <button
    type="button"
    class="game-card glass-surface"
    :class="{
      'game-card--available': game.status === 'available',
      'game-card--coming-soon': game.status !== 'available',
    }"
    :disabled="game.status !== 'available'"
    @click="onClick"
  >
    <span class="game-card__icon">{{ game.icon }}</span>
    <span class="game-card__name">{{ game.name }}</span>
    <span class="game-card__description">{{ game.description }}</span>
    <span v-if="game.status !== 'available'" class="game-card__badge">Bald verfügbar</span>
  </button>
</template>

<style scoped>
.game-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  text-align: left;
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  cursor: pointer;
  transition:
    transform var(--duration-base) var(--ease-standard),
    box-shadow var(--duration-base) ease;
}

.game-card--available:hover {
  transform: translateY(-4px);
}

.game-card--available:active {
  transform: scale(0.97) translateY(-1px);
}

.game-card--coming-soon {
  cursor: not-allowed;
  opacity: 0.5;
  filter: grayscale(0.4);
}

.game-card__icon {
  font-size: 2.4rem;
  line-height: 1;
}

.game-card__name {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.game-card__description {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.game-card__badge {
  margin-top: var(--space-2);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  background: var(--glass-bg-strong);
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
}
</style>
