<script setup lang="ts">
defineProps<{
  eyebrow: string
  playerName: string
  hint: string
  buttonLabel: string
}>()

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <div class="handoff">
    <p class="handoff__eyebrow">{{ eyebrow }}</p>
    <h2 class="handoff__name">{{ playerName }}</h2>
    <p class="handoff__hint">{{ hint }}</p>
    <button class="handoff__button" type="button" @click="emit('confirm')">
      {{ buttonLabel }}
    </button>
  </div>
</template>

<style scoped>
.handoff {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
}

.handoff__eyebrow {
  margin: 0;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
}

.handoff__name {
  margin: 0;
  font-size: 2.4rem;
  color: var(--color-text);
}

.handoff__hint {
  margin: 0;
  color: var(--color-text-muted);
  max-width: 30ch;
}

.handoff__button {
  margin-top: var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  padding: var(--space-3) var(--space-6);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
}

.handoff__button:active {
  transform: scale(0.97);
}
</style>
